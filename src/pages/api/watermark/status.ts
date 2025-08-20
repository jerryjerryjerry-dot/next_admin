import type { NextApiRequest, NextApiResponse } from 'next';

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
    // 健康检查端点
    const healthStatus = {
      success: true,
      message: '水印服务运行正常',
      timestamp: new Date().toISOString(),
      service: 'watermark-api',
      version: '1.0.0',
      status: 'healthy'
    };

    console.log('💚 [健康检查] 水印服务状态正常');
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '服务不可用',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
