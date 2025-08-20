import type { NextApiRequest, NextApiResponse } from 'next';
import { WATERMARK_API_CONFIG, VERCEL_UPLOAD_CONFIG } from '~/lib/watermark-config';

interface StatusResponse {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: string;
  environment: string;
  cors: {
    enabled: boolean;
    origin: string;
    allowCredentials: boolean;
    supportedMethods: string[];
  };
  config: {
    watermarkApi: {
      baseUrl: string;
      algorithm: string;
      host: string;
    };
    vercelUpload?: {
      uploadUrl: string;
      healthUrl: string;
    };
  };
  endpoints: {
    watermark: {
      add: string;
      extract: string;
      queryTask: string;
      upload: string;
      health: string;
    };
    general: {
      status: string;
      corsTest: string;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  const startTime = Date.now();
  console.log('\n📊 [API调用] GET /api/status');
  console.log('📥 服务器状态查询:', {
    method: req.method,
    origin: req.headers.origin || '同源请求',
    userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) + '...' : 'Unknown',
    timestamp: new Date().toISOString()
  });

  try {
    const statusResponse: StatusResponse = {
      success: true,
      message: '水印API服务运行正常',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}秒`,
      environment: process.env.NODE_ENV || 'development',
      cors: {
        enabled: true,
        origin: req.headers.origin || '同源请求',
        allowCredentials: true,
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
      config: {
        watermarkApi: {
          baseUrl: WATERMARK_API_CONFIG.baseUrl,
          algorithm: WATERMARK_API_CONFIG.algorithm,
          host: WATERMARK_API_CONFIG.host,
        },
        vercelUpload: VERCEL_UPLOAD_CONFIG ? {
          uploadUrl: VERCEL_UPLOAD_CONFIG.uploadUrl,
          healthUrl: VERCEL_UPLOAD_CONFIG.healthUrl,
        } : undefined,
      },
      endpoints: {
        watermark: {
          add: '/api/watermark/add',
          extract: '/api/watermark/extract',
          queryTask: '/api/watermark/task/:taskId',
          upload: '/api/watermark/upload',
          health: '/api/watermark/health',
        },
        general: {
          status: '/api/status',
          corsTest: '/api/cors-test',
        },
      },
    };

    console.log('✅ 服务器状态正常:', {
      environment: statusResponse.environment,
      uptime: statusResponse.uptime,
      nodeVersion: process.version,
      platform: process.platform,
    });

    console.log('📤 状态响应:', statusResponse);
    console.log('⏱️ 请求耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(statusResponse);

  } catch (error) {
    console.error('❌ 状态查询失败:', (error as Error).message);
    
    const errorResponse: StatusResponse = {
      success: false,
      message: '服务器状态检查失败',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}秒`,
      environment: process.env.NODE_ENV || 'development',
      cors: {
        enabled: true,
        origin: req.headers.origin || '同源请求',
        allowCredentials: true,
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
      config: {
        watermarkApi: {
          baseUrl: 'ERROR',
          algorithm: 'ERROR',
          host: 'ERROR',
        },
      },
      endpoints: {
        watermark: {
          add: '/api/watermark/add',
          extract: '/api/watermark/extract',
          queryTask: '/api/watermark/task/:taskId',
          upload: '/api/watermark/upload',
          health: '/api/watermark/health',
        },
        general: {
          status: '/api/status',
          corsTest: '/api/cors-test',
        },
      },
    };
    
    console.log('📤 状态错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);
    
    res.status(500).json(errorResponse);
  }
}

