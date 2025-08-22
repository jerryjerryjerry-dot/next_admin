import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // 获取处理记录列表
      const { 
        page = '1', 
        pageSize = '20', 
        keyword = '', 
        operation = '', 
        status = '' 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const skip = (pageNum - 1) * pageSizeNum;

      // 构建查询条件
      const where: {
        OR?: Array<{
          taskId?: { contains: string; mode: 'insensitive' };
          fileUrl?: { contains: string; mode: 'insensitive' };
          result?: { contains: string; mode: 'insensitive' };
        }>;
        operation?: string;
        status?: string;
      } = {};
      
      // 关键词搜索
      if (keyword && typeof keyword === 'string') {
        const searchTerm = keyword.toLowerCase();
        where.OR = [
          { taskId: { contains: searchTerm, mode: 'insensitive' } },
          { fileUrl: { contains: searchTerm, mode: 'insensitive' } },
          { result: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      // 操作类型过滤
      if (operation && typeof operation === 'string' && operation !== '') {
        where.operation = operation;
      }

      // 状态过滤
      if (status && typeof status === 'string' && status !== '') {
        where.status = status;
      }

      // 查询数据库
      const [records, total] = await Promise.all([
        db.watermarkRecord.findMany({
          where,
          skip,
          take: pageSizeNum,
          orderBy: { createdAt: 'desc' },
          include: {
            watermarkContent: {
              select: {
                content: true,
                watermarkId: true
              }
            },
            policy: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }),
        db.watermarkRecord.count({ where })
      ]);

      // 转换数据格式，匹配前端期望的结构
      const transformedRecords = records.map(record => {
        // 从fileUrl中提取文件名
        const fileName = record.fileUrl ? 
          decodeURIComponent(record.fileUrl.split('/').pop() ?? 'unknown') : 
          'unknown';

        return {
          id: record.id,
          taskId: record.taskId,
          operation: record.operation,
          status: record.status,
          fileName: fileName,
          fileSize: record.fileSize ?? 0,
          fileUrl: record.fileUrl,
          watermarkText: record.watermarkContent?.content ?? null,
          policyId: record.policyId,
          progress: record.progress,
          resultUrl: record.result,
          extractedContent: record.operation === 'extract' ? record.result : undefined,
          confidence: record.metadata ? (JSON.parse(record.metadata) as { confidence?: number }).confidence : undefined,
          error: record.errorMessage,
          createdAt: record.createdAt,
          completedAt: record.updatedAt, // 使用updatedAt作为completedAt
          metadata: record.metadata ? JSON.parse(record.metadata) as Record<string, unknown> : {}
        };
      });

      res.status(200).json({
        success: true,
        data: transformedRecords,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: total,
          totalPages: Math.ceil(total / pageSizeNum)
        }
      });

    } else {
      res.status(405).json({ 
        success: false, 
        message: '不支持的请求方法' 
      });
    }
  } catch (error) {
    console.error('记录查询API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
