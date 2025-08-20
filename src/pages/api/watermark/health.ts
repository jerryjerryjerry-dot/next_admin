import type { NextApiRequest, NextApiResponse } from 'next';
import { WATERMARK_API_CONFIG } from '~/lib/watermark-config';

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
    // 这里可以添加对外部水印服务的健康检查
    // 暂时返回基本的健康状态
    const healthStatus = {
      success: true,
      isHealthy: true,
      timestamp: new Date().toISOString(),
      service: 'watermark-api',
      config: {
        baseUrl: WATERMARK_API_CONFIG.baseUrl,
        host: WATERMARK_API_CONFIG.host,
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}