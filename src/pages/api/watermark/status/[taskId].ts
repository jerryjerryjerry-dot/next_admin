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

  try {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '缺少任务ID参数'
      });
    }

    console.log('🔍 查询任务状态:', taskId);

    const result = await queryWatermarkTask(taskId);

    console.log('✅ 任务状态查询成功:', result);

    // 处理任务状态和进度
    const taskStatus = result.data?.task_status ?? 'unknown';
    const progress = getProgressFromStatus(taskStatus);
    const estimatedTime = generateEstimatedTime(progress);

    // 确保返回正确的success状态
    const isSuccess = result.code === 200 || result.success;
    
    res.status(200).json({
      success: isSuccess,
      taskId: result.data?.task_id,
      status: taskStatus,
      progress,
      estimatedTime,
      result: result.data?.result,
      bizId: result.data?.biz_id,
      taskType: result.data?.task_type,
      requestId: result.request_id,
      message: result.message
    });

  } catch (error) {
    console.error('❌ 查询任务状态失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      message: '查询任务状态失败',
      error: errorMessage
    });
  }
}

// 根据任务状态计算进度
function getProgressFromStatus(taskStatus: string): number {
  switch (taskStatus) {
    case 'pending': return 5;
    case 'running': return 50;
    case 'finished': return 100;
    case 'failed': return 0;
    default: return 0;
  }
}

// 生成预估时间
function generateEstimatedTime(progress: number): string {
  if (progress >= 100) return '已完成';
  if (progress === 0) return '处理失败';
  
  const remainingPercent = 100 - progress;
  const estimatedSeconds = Math.floor((remainingPercent / 100) * 120);
  
  if (estimatedSeconds < 60) {
    return `预计还需 ${estimatedSeconds} 秒`;
  } else {
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `预计还需 ${minutes}分${seconds}秒`;
  }
}
