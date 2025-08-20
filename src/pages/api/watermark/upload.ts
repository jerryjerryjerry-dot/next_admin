import type { NextApiRequest, NextApiResponse } from 'next';
// import { createWatermarkTask } from '~/lib/watermark-config'; // 暂时不使用

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
  console.log('📁 [API调用] POST /api/watermark/upload');

  try {
    // 这里应该集成真实的文件上传逻辑
    // 目前返回模拟响应，确保API结构正确
    const mockResponse = {
      success: true,
      message: '文件上传成功',
      fileUrl: '/uploads/mock-file.pdf',
      fileName: 'mock-file.pdf',
      fileSize: 1024000,
      uploadTime: new Date().toISOString()
    };

    console.log('✅ 模拟上传成功');
    console.log('⏱️ 上传耗时:', `${Date.now() - startTime}ms`);
    
    res.status(200).json(mockResponse);

  } catch (error) {
    console.error('❌ 上传失败:', error);
    
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
