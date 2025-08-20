import crypto from 'crypto';
import https from 'https';

// 水印API配置
export const WATERMARK_API_CONFIG = {
  // 预发环境地址 (直接使用IP，因为hosts配置可能有问题)
  baseUrl: 'https://120.27.196.223',
  host: 'cs.sase.pre.eagleyun.com', // Host头用的域名
  accessKey: 'CnCZar6ZXKvqdBKMJ54vwNzO',
  secretKey: 'ajKx1uSye4wwa9T7srJQYlDOLK34NR0F1yDUDGgL',
  algorithm: 'hmac-sha256'
};

// Vercel上传服务配置
export const VERCEL_UPLOAD_CONFIG = {
  uploadUrl: 'https://dxysbackend4.vercel.app/api/upload/public',
  queryUrl: 'https://dxysbackend4.vercel.app/api/files',
  healthUrl: 'https://dxysbackend4.vercel.app/api/health'
};

// 忽略SSL证书验证（仅用于测试）
export const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined // 完全忽略主机名验证
});

/**
 * 计算HMAC-SHA256签名
 */
export function calculateSignature(
  method: string, 
  path: string, 
  queryString: string, 
  accessKey: string, 
  date: string, 
  secretKey: string
): string {
  const signString = `${method}\n${path}\n${queryString}\n${accessKey}\n${date}\n`;

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(signString, 'utf8');
  const signature = hmac.digest('base64');

  return signature;
}

/**
 * 构造查询参数字符串（按字典序排序）
 */
export function buildCanonicalQueryString(params: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const sortedKeys = Object.keys(params).sort();
  const queryPairs: string[] = [];

  for (const key of sortedKeys) {
    const value = params[key];
    if (Array.isArray(value)) {
      const sortedValues = [...(value as unknown[])].sort();
      for (const v of sortedValues) {
        let stringValue = '';
        if (v == null) {
          stringValue = '';
        } else if (typeof v === 'object' && v !== null) {
          stringValue = JSON.stringify(v);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          stringValue = String(v);
        }
        queryPairs.push(`${key}=${encodeURIComponent(stringValue)}`);
      }
    } else {
      let stringValue = '';
      if (value == null) {
        stringValue = '';
      } else if (typeof value === 'object' && value !== null) {
        stringValue = JSON.stringify(value);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        stringValue = String(value);
      }
      queryPairs.push(`${key}=${encodeURIComponent(stringValue)}`);
    }
  }

  return queryPairs.join('&');
}

/**
 * 生成GMT格式的当前时间
 */
export function generateGMTDate(): string {
  const now = new Date();
  return now.toUTCString();
}

/**
 * 使用原生Node.js https模块发送请求
 */
function makeHttpsRequest(options: https.RequestOptions, postData?: string): Promise<{
  statusCode?: number;
  statusMessage?: string;
  headers: Record<string, unknown>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers as Record<string, unknown>,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * 创建水印添加任务
 */
export async function createWatermarkTask(fileUrl: string, content: string, bizId: string): Promise<{
  success: boolean;
  data?: string;
  message?: string;
  [key: string]: unknown;
}> {
  const method = 'POST';
  const path = '/dlp/file_process/add_watermark_task';
  const queryString = '';
  const date = generateGMTDate();

  const signature = calculateSignature(
    method,
    path,
    queryString,
    WATERMARK_API_CONFIG.accessKey,
    date,
    WATERMARK_API_CONFIG.secretKey
  );

  const requestBody = JSON.stringify({
    file_url: fileUrl,
    content: content,
    biz_id: bizId
  });

  const options: https.RequestOptions = {
    hostname: '120.27.196.223', // 直接使用IP地址
    port: 443,
    path: path,
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host, // Host头设置为域名
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    // 忽略SSL证书验证和主机名验证
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };

  const response = await makeHttpsRequest(options, requestBody);
  const responseText = response.body;

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (response.statusCode !== 200) {
    throw new Error(`API请求失败: ${response.statusCode} ${response.statusMessage} - ${responseText}`);
  }

  return result as {
    success: boolean;
    data?: string;
    message?: string;
    [key: string]: unknown;
  };
}

/**
 * 查询水印任务
 */
export async function queryWatermarkTask(taskId: string): Promise<{
  success: boolean;
  data?: {
    task_status?: string;
    task_type?: string;
    result?: {
      code?: number;
      data?: string;
      message?: string;
    };
    [key: string]: unknown;
  };
  message?: string;
  [key: string]: unknown;
}> {
  const method = 'GET';
  const path = '/dlp/file_process/task';
  const queryParams = { task_id: taskId };
  const queryString = buildCanonicalQueryString(queryParams);
  const date = generateGMTDate();

  const signature = calculateSignature(
    method,
    path,
    queryString,
    WATERMARK_API_CONFIG.accessKey,
    date,
    WATERMARK_API_CONFIG.secretKey
  );

  const options: https.RequestOptions = {
    hostname: '120.27.196.223', // 直接使用IP地址
    port: 443,
    path: `${path}?${queryString}`,
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host, // Host头设置为域名
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Accept': 'application/json'
    },
    // 忽略SSL证书验证和主机名验证
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };

  const response = await makeHttpsRequest(options);
  const responseText = response.body;

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (response.statusCode !== 200) {
    throw new Error(`API请求失败: ${response.statusCode} ${response.statusMessage} - ${responseText}`);
  }

  return result as {
    success: boolean;
    data?: {
      task_status?: string;
      task_type?: string;
      result?: {
        code?: number;
        data?: string;
        message?: string;
      };
      [key: string]: unknown;
    };
    message?: string;
    [key: string]: unknown;
  };
}

/**
 * 创建水印提取任务
 */
export async function createExtractWatermarkTask(fileUrl: string, bizId: string): Promise<{
  success: boolean;
  data?: string;
  message?: string;
  [key: string]: unknown;
}> {
  const method = 'POST';
  const path = '/dlp/file_process/extract_watermark_task';
  const queryString = '';
  const date = generateGMTDate();

  const signature = calculateSignature(
    method,
    path,
    queryString,
    WATERMARK_API_CONFIG.accessKey,
    date,
    WATERMARK_API_CONFIG.secretKey
  );

  const requestBody = JSON.stringify({
    file_url: fileUrl,
    biz_id: bizId
  });

  const options: https.RequestOptions = {
    hostname: '120.27.196.223', // 直接使用IP地址
    port: 443,
    path: path,
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host, // Host头设置为域名
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    // 忽略SSL证书验证和主机名验证
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };

  const response = await makeHttpsRequest(options, requestBody);
  const responseText = response.body;

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (response.statusCode !== 200) {
    throw new Error(`API请求失败: ${response.statusCode} ${response.statusMessage} - ${responseText}`);
  }

  return result as {
    success: boolean;
    data?: string;
    message?: string;
    [key: string]: unknown;
  };
}
