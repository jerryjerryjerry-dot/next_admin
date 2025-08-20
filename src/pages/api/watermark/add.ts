import type { NextApiRequest, NextApiResponse } from 'next';
import { createWatermarkTask } from '~/lib/watermark-config';

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

  const startTime = Date.now();
  console.log('\n🎯 [API调用] POST /api/watermark/add');
  
  // 类型安全的请求体解析
  const body = req.body as { fileUrl?: string; content?: string; bizId?: string };
  console.log('📥 请求参数:', {
    fileUrl: body.fileUrl ? body.fileUrl.substring(0, 50) + '...' : undefined,
    content: body.content,
    bizId: body.bizId,
    timestamp: new Date().toISOString()
  });

  try {
    const { fileUrl, content, bizId } = body;

    if (!fileUrl || !content) {
      const errorResponse = {
        success: false,
        message: '缺少必需参数: fileUrl 和 content'
      };
      console.log('❌ 参数验证失败:', errorResponse);
      console.log('⏱️ 请求耗时:', `${Date.now() - startTime}ms\n`);
      return res.status(400).json(errorResponse);
    }

    const finalBizId = bizId ?? `add_${Date.now()}`;
    console.log('🔄 调用水印服务, bizId:', finalBizId);
    const result = await createWatermarkTask(fileUrl, content, finalBizId);
    
    // 类型安全的结果处理
    const resultData = result as { data?: string; [key: string]: unknown };

    const successResponse = {
      success: true,
      data: result,
      taskId: resultData.data
    };
    console.log('✅ 水印任务创建成功:', {
      taskId: resultData.data,
      bizId: finalBizId,
      responseTime: `${Date.now() - startTime}ms`
    });
    console.log('📤 响应数据:', successResponse);
    console.log('⏱️ 总耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(successResponse);
  } catch (error) {
    console.error('❌ 创建水印任务失败:', (error as Error).message);
    const errorResponse = {
      success: false,
      message: (error as Error).message
    };
    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);
    res.status(500).json(errorResponse);
  }
}
