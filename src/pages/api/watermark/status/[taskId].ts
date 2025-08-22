import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

interface StatusResponse {
  success: boolean;
  taskId?: string;
  status?: string;
  progress?: number;
  estimatedTime?: string;
  result?: {
    downloadUrl?: string;
    extractedContent?: string;
    confidence?: number;
    message?: string;
  };
  message?: string;
  error?: string;
}

// 根据进度计算预估时间
function calculateEstimatedTime(progress: number, operation: string): string {
  if (progress >= 100) return '已完成';
  if (progress === 0) return '正在初始化...';
  
  const remainingProgress = 100 - progress;
  const estimatedSeconds = Math.ceil(remainingProgress * 0.3); // 假设每1%需要0.3秒
  
  if (estimatedSeconds <= 60) {
    return `预计还需 ${estimatedSeconds} 秒`;
  } else {
    const minutes = Math.ceil(estimatedSeconds / 60);
    return `预计还需 ${minutes} 分钟`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '只支持GET请求'
    });
  }

  const startTime = Date.now();
  const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({
      success: false,
      message: '缺少taskId参数'
    });
  }

  console.log(`\n📋 [API调用] GET /api/watermark/status/${taskId}`);

  try {
    // 从数据库查询任务记录
    const record = await db.watermarkRecord.findFirst({
      where: { taskId: taskId },
      include: {
        watermarkContent: true,
        policy: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    console.log('📋 找到任务记录:', {
      taskId: record.taskId,
      status: record.status,
      progress: record.progress,
      operation: record.operation
    });

    // 构建结果对象
    let result: StatusResponse['result'] = undefined;
    
    if (record.status === 'completed') {
      if (record.operation === 'embed' && record.result) {
        // 水印嵌入完成，返回下载URL
        result = {
          downloadUrl: record.result
        };
      } else if (record.operation === 'extract' && record.result) {
        // 水印提取完成，返回提取的内容
        const metadata = record.metadata ? JSON.parse(record.metadata) : {};
        result = {
          extractedContent: record.result,
          confidence: metadata.confidence || 0.8
        };
      }
    } else if (record.status === 'failed') {
      result = {
        message: record.errorMessage || '处理失败'
      };
    }

    // 计算预估时间
    const estimatedTime = calculateEstimatedTime(record.progress, record.operation);

    const responseData: StatusResponse = {
      success: true,
      taskId: record.taskId || taskId,
      status: record.status,
      progress: record.progress,
      estimatedTime: estimatedTime,
      result: result
    };

    console.log('📤 状态响应:', responseData);
    console.log('⏱️ 状态查询耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ 状态查询失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorResponse: StatusResponse = {
      success: false,
      message: '状态查询失败',
      error: errorMessage
    };

    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);

    res.status(500).json(errorResponse);
  }
}