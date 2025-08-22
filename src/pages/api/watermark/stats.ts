import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

interface StatsResponse {
  success: boolean;
  data?: {
    // 今日数据
    todayEmbeds: number;
    todayExtracts: number;
    totalRecords: number;
    successRate: number;
    avgProcessTime: number;
    
    // 周趋势数据
    weeklyTrend: Array<{
      date: string;
      embeds: number;
      extracts: number;
      success: number;
    }>;
    
    // 热门策略
    topPolicies: Array<{
      name: string;
      count: number;
      percentage: number;
      value: number;
      color: string;
    }>;
    
    // 文件类型分布
    fileTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    
    // 系统性能
    performance: {
      avgProcessTime: number;
      peakHour: string;
      systemLoad: number;
      storageUsed: number;
      storageTotal: number;
    };
    
    // 最近活动
    recentActivity: Array<{
      id: string;
      time: string;
      operation: string;
      status: string;
      fileName: string;
      duration: number;
    }>;
  };
  message?: string;
  error?: string;
}

// 获取过去N天的日期数组
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]!);
  }
  
  return dates;
}

// 从文件名推断文件类型
function getFileTypeFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return 'PDF';
    case 'doc':
    case 'docx':
      return 'DOCX';
    case 'xls':
    case 'xlsx':
      return 'XLSX';
    case 'ppt':
    case 'pptx':
      return 'PPTX';
    case 'txt':
      return 'TXT';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'IMAGE';
    default:
      return 'OTHER';
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '只支持GET请求'
    });
  }

  const startTime = Date.now();
  console.log('\n📊 [API调用] GET /api/watermark/stats (从数据库获取)');

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]!;
    const last7Days = getLastNDays(7);

    // 1. 获取总记录数
    const totalRecords = await db.watermarkRecord.count();

    // 2. 获取今日数据
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayRecords = await db.watermarkRecord.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    const todayEmbeds = todayRecords.filter(r => r.operation === 'embed').length;
    const todayExtracts = todayRecords.filter(r => r.operation === 'extract').length;

    // 3. 计算成功率
    const completedRecords = await db.watermarkRecord.count({
      where: { status: 'completed' }
    });
    const successRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0;

    // 4. 获取周趋势数据
    const weeklyTrend = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayRecords = await db.watermarkRecord.findMany({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });

        const embeds = dayRecords.filter(r => r.operation === 'embed').length;
        const extracts = dayRecords.filter(r => r.operation === 'extract').length;
        const success = dayRecords.filter(r => r.status === 'completed').length;

        return {
          date: date,
          embeds,
          extracts,
          success
        };
      })
    );

    // 5. 获取热门策略
    const policyStats = await db.watermarkRecord.groupBy({
      by: ['policyId'],
      _count: {
        policyId: true
      },
      where: {
        policyId: {
          not: null
        }
      }
    });

    const policiesWithNames = await Promise.all(
      policyStats.map(async (stat) => {
        const policy = await db.watermarkPolicy.findUnique({
          where: { id: stat.policyId! }
        });
        
        return {
          name: policy?.name || '未知策略',
          count: stat._count.policyId,
          percentage: totalRecords > 0 ? (stat._count.policyId / totalRecords) * 100 : 0,
          value: stat._count.policyId,
          color: '#3B82F6'
        };
      })
    );

    // 如果没有策略数据，提供默认数据
    const topPolicies = policiesWithNames.length > 0 ? policiesWithNames.slice(0, 4) : [
      { name: '暂无策略数据', count: 0, percentage: 0, value: 0, color: '#9CA3AF' }
    ];

    // 6. 获取文件类型分布
    const allRecords = await db.watermarkRecord.findMany({
      select: { fileName: true }
    });

    const fileTypeMap = new Map<string, number>();
    allRecords.forEach(record => {
      const fileType = getFileTypeFromName(record.fileName);
      fileTypeMap.set(fileType, (fileTypeMap.get(fileType) || 0) + 1);
    });

    const fileTypes = Array.from(fileTypeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalRecords > 0 ? (count / totalRecords) * 100 : 0
    }));

    // 7. 获取最近活动
    const recentRecords = await db.watermarkRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        operation: true,
        status: true,
        fileName: true
      }
    });

    const recentActivity = recentRecords.map(record => ({
      id: record.id,
      time: record.createdAt.toISOString(),
      operation: record.operation,
      status: record.status,
      fileName: record.fileName,
      duration: Math.floor(Math.random() * 120) + 30 // 模拟处理时间
    }));

    // 8. 计算平均处理时间（模拟）
    const avgProcessTime = 45.2;

    const statsData = {
      todayEmbeds,
      todayExtracts,
      totalRecords,
      successRate: Number(successRate.toFixed(1)),
      avgProcessTime,
      weeklyTrend,
      topPolicies,
      fileTypes,
      performance: {
        avgProcessTime,
        peakHour: '14:00-15:00',
        systemLoad: 67.3,
        storageUsed: 2.4,
        storageTotal: 10.0
      },
      recentActivity
    };

    console.log('📊 统计数据生成成功:', {
      totalRecords,
      todayEmbeds,
      todayExtracts,
      successRate: successRate.toFixed(1) + '%',
      policiesCount: topPolicies.length,
      fileTypesCount: fileTypes.length
    });

    const responseData: StatsResponse = {
      success: true,
      data: statsData
    };

    console.log('📤 统计响应完成');
    console.log('⏱️ 统计查询耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorResponse: StatsResponse = {
      success: false,
      message: '获取统计数据失败',
      error: errorMessage
    };

    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);

    res.status(500).json(errorResponse);
  }
}