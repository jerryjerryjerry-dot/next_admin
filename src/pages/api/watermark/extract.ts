import type { NextApiRequest, NextApiResponse } from 'next';
import { createExtractWatermarkTask } from '~/lib/watermark-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '只支持POST请求' 
    });
  }

  try {
    const { fileUrl, bizId } = req.body as {
      fileUrl: string;
      bizId?: string;
    };

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: fileUrl'
      });
    }

    console.log('🔍 创建提取任务:', { fileUrl, bizId });

    const result = await createExtractWatermarkTask(
      fileUrl,
      bizId ?? `extract_${Date.now()}`
    );

    console.log('✅ 提取任务创建成功:', result);

    // 外部API返回格式: {taskId, message, requestId}
    // 需要转换为前端期望的格式: {success, taskId, message}
    res.status(200).json({
      success: true,
      taskId: (result as any).taskId ?? result.data,
      message: result.message ?? 'Success',
      requestId: (result as any).requestId ?? result.request_id
    });

  } catch (error) {
    console.error('❌ 创建提取任务失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      message: '创建提取任务失败',
      error: errorMessage
    });
  }
}
