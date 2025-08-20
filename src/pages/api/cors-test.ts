import type { NextApiRequest, NextApiResponse } from 'next';

interface CorsTestResponse {
  success: boolean;
  message: string;
  requestInfo: {
    method: string;
    origin: string;
    userAgent: string;
    contentType: string;
    timestamp: string;
  };
  headers: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Credentials': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CorsTestResponse>
) {
  const startTime = Date.now();
  console.log('\n🌐 [API调用] ' + req.method + ' /api/cors-test');
  console.log('📥 CORS测试请求:', {
    method: req.method,
    origin: req.headers.origin || '同源请求',
    userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) + '...' : 'Unknown',
    contentType: req.headers['content-type'] || 'None',
    timestamp: new Date().toISOString()
  });

  try {
    // 设置CORS头部
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Network-Test');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24小时预检缓存

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      console.log('🔄 处理CORS预检请求:', {
        origin: req.headers.origin || '无',
        method: req.headers['access-control-request-method'] || '无',
        headers: req.headers['access-control-request-headers'] || '无'
      });
      
      res.status(200).end();
      return;
    }

    const corsResponse: CorsTestResponse = {
      success: true,
      message: 'CORS跨域测试成功',
      requestInfo: {
        method: req.method || 'UNKNOWN',
        origin: req.headers.origin || '同源请求',
        userAgent: req.headers['user-agent'] || 'Unknown',
        contentType: req.headers['content-type'] || 'None',
        timestamp: new Date().toISOString()
      },
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Network-Test'
      }
    };

    console.log('✅ CORS跨域测试成功:', {
      method: req.method,
      origin: req.headers.origin || '同源请求',
      allowCredentials: true
    });
    console.log('📤 CORS响应:', corsResponse);
    console.log('⏱️ 请求耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(corsResponse);

  } catch (error) {
    console.error('❌ CORS测试失败:', (error as Error).message);
    
    const errorResponse: CorsTestResponse = {
      success: false,
      message: 'CORS测试失败',
      requestInfo: {
        method: req.method || 'UNKNOWN',
        origin: req.headers.origin || '同源请求',
        userAgent: req.headers['user-agent'] || 'Unknown',
        contentType: req.headers['content-type'] || 'None',
        timestamp: new Date().toISOString()
      },
      headers: {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Network-Test'
      }
    };
    
    console.log('📤 CORS错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);
    
    res.status(500).json(errorResponse);
  }
}

