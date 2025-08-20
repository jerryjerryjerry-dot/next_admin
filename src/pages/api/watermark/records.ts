import type { NextApiRequest, NextApiResponse } from 'next';

// 模拟处理记录数据
const mockRecords = [
  {
    id: "1",
    taskId: "task_001",
    operation: "embed",
    status: "completed",
    fileName: "重要文档.pdf",
    fileSize: 1024000,
    fileUrl: "https://example.com/files/document1.pdf",
    watermarkText: "机密文档",
    policyId: "1",
    progress: 100,
    resultUrl: "https://example.com/results/watermarked_document1.pdf",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    completedAt: new Date("2024-01-15T10:02:30Z"),
    metadata: {
      userAgent: "Mozilla/5.0...",
      deviceInfo: "Web Browser"
    }
  },
  {
    id: "2",
    taskId: "task_002", 
    operation: "extract",
    status: "completed",
    fileName: "测试文件.docx",
    fileSize: 512000,
    fileUrl: "https://example.com/files/document2.docx",
    watermarkText: null,
    policyId: null,
    progress: 100,
    extractedContent: "内部资料",
    confidence: 0.95,
    createdAt: new Date("2024-01-15T11:00:00Z"),
    completedAt: new Date("2024-01-15T11:01:45Z"),
    metadata: {
      userAgent: "Mozilla/5.0...",
      deviceInfo: "Web Browser"
    }
  },
  {
    id: "3",
    taskId: "task_003",
    operation: "embed", 
    status: "processing",
    fileName: "报告.xlsx",
    fileSize: 2048000,
    fileUrl: "https://example.com/files/report.xlsx",
    watermarkText: "绝密",
    policyId: "2",
    progress: 65,
    createdAt: new Date("2024-01-15T12:00:00Z"),
    metadata: {
      userAgent: "Mozilla/5.0...",
      deviceInfo: "Web Browser"
    }
  },
  {
    id: "4",
    taskId: "task_004",
    operation: "embed",
    status: "failed",
    fileName: "损坏文件.pdf", 
    fileSize: 0,
    fileUrl: "https://example.com/files/corrupted.pdf",
    watermarkText: "机密文档",
    policyId: "1",
    progress: 0,
    error: "文件格式不支持或文件已损坏",
    createdAt: new Date("2024-01-15T13:00:00Z"),
    metadata: {
      userAgent: "Mozilla/5.0...",
      deviceInfo: "Web Browser"
    }
  }
];

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

      let filteredRecords = mockRecords;

      // 关键词搜索
      if (keyword && typeof keyword === 'string') {
        const searchTerm = keyword.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.fileName.toLowerCase().includes(searchTerm) ||
          record.taskId.toLowerCase().includes(searchTerm) ||
          record.watermarkText?.toLowerCase().includes(searchTerm)
        );
      }

      // 操作类型过滤
      if (operation && typeof operation === 'string' && operation !== '') {
        filteredRecords = filteredRecords.filter(record => record.operation === operation);
      }

      // 状态过滤
      if (status && typeof status === 'string' && status !== '') {
        filteredRecords = filteredRecords.filter(record => record.status === status);
      }

      // 分页
      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const startIndex = (pageNum - 1) * pageSizeNum;
      const endIndex = startIndex + pageSizeNum;
      
      const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedRecords,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: filteredRecords.length,
          totalPages: Math.ceil(filteredRecords.length / pageSizeNum)
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
