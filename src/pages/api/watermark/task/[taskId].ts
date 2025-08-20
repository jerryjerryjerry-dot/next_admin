import type { NextApiRequest, NextApiResponse } from 'next';
import { queryWatermarkTask } from '~/lib/watermark-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: '只支持GET请求' 
    });
  }

  const startTime = Date.now();
  const { taskId } = req.query;
  
  console.log(`\n🔍 [API调用] GET /api/watermark/task/${String(taskId)}`);

  try {
    if (!taskId || typeof taskId !== 'string') {
      const errorResponse = {
        success: false,
        message: '无效的任务ID'
      };
      console.log('❌ 参数验证失败:', errorResponse);
      return res.status(400).json(errorResponse);
    }

    console.log('🔄 查询任务状态, taskId:', taskId);
    const result = await queryWatermarkTask(taskId) as {
      data?: {
        task_status?: string;
      };
    };

    const successResponse = {
      success: true,
      data: result,
      taskId: taskId,
      timestamp: new Date().toISOString()
    };

    console.log('✅ 任务状态查询成功:', {
      taskId: taskId,
      status: result?.data?.task_status ?? 'unknown',
      responseTime: `${Date.now() - startTime}ms`
    });
    console.log('⏱️ 总耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(successResponse);
  } catch (error) {
    console.error('❌ 查询任务状态失败:', (error as Error).message);
    const errorResponse = {
      success: false,
      message: (error as Error).message,
      taskId: taskId
    };
    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);
    res.status(500).json(errorResponse);
  }
}
