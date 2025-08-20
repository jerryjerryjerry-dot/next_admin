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

// 忽略SSL证书验证（仅用于测试）
export const httpsAgent = new https.Agent({
  rejectUnauthorized: false
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
 * 创建水印添加任务
 */
export async function createWatermarkTask(fileUrl: string, content: string, bizId: string): Promise<unknown> {
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

  const url = `${WATERMARK_API_CONFIG.baseUrl}${path}`;
  const requestBody = JSON.stringify({
    file_url: fileUrl,
    content: content,
    biz_id: bizId
  });

  const options = {
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host,
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: requestBody,
    agent: httpsAgent
  };

  const response = await fetch(url, options);
  const responseText = await response.text();

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  return result;
}

/**
 * 查询水印任务
 */
export async function queryWatermarkTask(taskId: string): Promise<unknown> {
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

  const url = `${WATERMARK_API_CONFIG.baseUrl}${path}?${queryString}`;

  const options = {
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host,
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Accept': 'application/json'
    },
    agent: httpsAgent
  };

  const response = await fetch(url, options);
  const responseText = await response.text();

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  return result;
}

/**
 * 创建水印提取任务
 */
export async function createExtractWatermarkTask(fileUrl: string, bizId: string): Promise<unknown> {
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

  const url = `${WATERMARK_API_CONFIG.baseUrl}${path}`;
  const requestBody = JSON.stringify({
    file_url: fileUrl,
    biz_id: bizId
  });

  const options = {
    method: method,
    headers: {
      'Host': WATERMARK_API_CONFIG.host,
      'X-HMAC-ALGORITHM': WATERMARK_API_CONFIG.algorithm,
      'X-HMAC-ACCESS-KEY': WATERMARK_API_CONFIG.accessKey,
      'X-HMAC-SIGNATURE': signature,
      'Date': date,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: requestBody,
    agent: httpsAgent
  };

  const response = await fetch(url, options);
  const responseText = await response.text();

  let result: unknown;
  try {
    result = JSON.parse(responseText) as unknown;
  } catch {
    result = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  return result;
}
