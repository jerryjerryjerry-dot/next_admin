import type { NextApiRequest, NextApiResponse } from 'next';

// 模拟统计数据
const generateMockStats = () => {
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return {
    // 今日数据
    todayEmbeds: 156,
    todayExtracts: 89,
    totalRecords: 1247,
    successRate: 96.2,
    avgProcessTime: 45.2,
    
    // 周趋势数据
    weeklyTrend: last7Days.map((date, index) => ({
      date: date,
      embeds: Math.floor(Math.random() * 50) + 80 + index * 8,
      extracts: Math.floor(Math.random() * 30) + 40 + index * 5,
      success: Math.floor(Math.random() * 20) + 90 + index * 2
    })),
    
    // 热门策略
    topPolicies: [
      { name: '标准文档水印', count: 456, percentage: 36.6, value: 456, color: '#3B82F6' },
      { name: '高安全级别', count: 312, percentage: 25.0, value: 312, color: '#10B981' },
      { name: '轻量水印', count: 234, percentage: 18.8, value: 234, color: '#F59E0B' },
      { name: '其他策略', count: 245, percentage: 19.6, value: 245, color: '#EF4444' }
    ],
    
    // 文件类型分布
    fileTypes: [
      { type: 'PDF', count: 623, percentage: 50.0 },
      { type: 'DOCX', count: 312, percentage: 25.0 },
      { type: 'XLSX', count: 187, percentage: 15.0 },
      { type: 'PPTX', count: 125, percentage: 10.0 }
    ],
    
    // 系统性能
    performance: {
      avgProcessTime: 45.2, // 秒
      peakHour: '14:00-15:00',
      systemLoad: 67.3, // 百分比
      storageUsed: 2.4, // GB
      storageTotal: 10.0 // GB
    },
    
    // 最近活动
    recentActivity: Array.from({ length: 10 }, (_, i) => {
      const time = new Date(now.getTime() - i * 300000); // 每5分钟一条
      const operations = ['embed', 'extract'];
      const statuses = ['completed', 'processing', 'failed'];
      const files = ['报告.pdf', '合同.docx', '数据.xlsx', '演示.pptx'];
      
      return {
        id: `activity_${i}`,
        time: time.toISOString(),
        operation: operations[Math.floor(Math.random() * operations.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        fileName: files[Math.floor(Math.random() * files.length)],
        duration: Math.floor(Math.random() * 120) + 30
      };
    })
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      console.log('📊 获取水印系统统计数据');

      const stats = generateMockStats();

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } else {
      res.status(405).json({ 
        success: false, 
        message: '只支持GET请求' 
      });
    }
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: errorMessage
    });
  }
}
