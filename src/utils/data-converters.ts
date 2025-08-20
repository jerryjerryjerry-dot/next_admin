// 数据转换工具函数
import type { ApiAppResponse, AppEntry, MockApp } from "~/types/api-response";

/**
 * 验证状态字段
 */
function validateStatus(status: unknown): "active" | "inactive" {
  if (status === "active" || status === "inactive") {
    return status;
  }
  const statusStr = typeof status === 'object' && status !== null 
    ? JSON.stringify(status) 
    : String(status);
  console.warn(`Invalid status value: ${statusStr}, defaulting to "active"`);
  return "active";
}

/**
 * 验证时间字段
 */
function validateDate(dateValue: unknown, fieldName: string): string {
  if (typeof dateValue === 'string' && dateValue.trim()) {
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return dateValue;
      }
    } catch {
      // 继续到默认处理
    }
  }
      const valueStr = typeof dateValue === 'object' && dateValue !== null 
        ? JSON.stringify(dateValue) 
        : String(dateValue);
      console.warn(`Invalid date value for ${fieldName}:`, valueStr, ', using current time');
  return new Date().toISOString();
}

/**
 * 验证字符串字段
 */
function validateString(value: unknown, fieldName: string, defaultValue = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value !== null && value !== undefined) {
    let valueStr = '';
    if (typeof value === 'object' && value !== null) {
      valueStr = JSON.stringify(value);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      valueStr = String(value);
    }
    console.warn(`Invalid ${fieldName} value:`, valueStr, ', converting to string');
    return valueStr;
  }
  return defaultValue;
}

/**
 * 将 API 返回的数据转换为组件期望的 AppEntry 类型
 */
export function convertApiToAppEntry(apiData: ApiAppResponse[]): AppEntry[] {
  return apiData.map(item => ({
    id: validateString(item.id, 'id'),
    appName: validateString(item.appName, 'appName'),
    appType: validateString(item.appType, 'appType'),
    categoryPath: validateString(item.categoryPath, 'categoryPath'),
    ip: (typeof item.ip === 'string' && item.ip.trim()) ? item.ip : undefined,
    domain: (typeof item.domain === 'string' && item.domain.trim()) ? item.domain : undefined,
    url: (typeof item.url === 'string' && item.url.trim()) ? item.url : undefined,
    status: validateStatus(item.status),
    isBuiltIn: Boolean(item.isBuiltIn),
    confidence: (typeof item.confidence === 'number' && !isNaN(item.confidence)) 
      ? item.confidence 
      : undefined,
    createdAt: validateDate(item.createdAt, 'createdAt'),
    updatedAt: validateDate(item.updatedAt, 'updatedAt'),
    category: item.category,
  }));
}

/**
 * 将 Mock 数据转换为组件期望的 AppEntry 类型
 */
export function convertMockToAppEntry(mockData: MockApp[]): AppEntry[] {
  return mockData.map(item => ({
    id: validateString(item.id, 'id'),
    appName: validateString(item.appName, 'appName'),
    appType: validateString(item.appType, 'appType'),
    categoryPath: validateString(item.categoryPath, 'categoryPath'),
    ip: (typeof item.ip === 'string' && item.ip.trim()) ? item.ip : undefined,
    domain: (typeof item.domain === 'string' && item.domain.trim()) ? item.domain : undefined,
    url: (typeof item.url === 'string' && item.url.trim()) ? item.url : undefined,
    status: validateStatus(item.status),
    isBuiltIn: Boolean(item.isBuiltIn),
    confidence: (typeof item.confidence === 'number' && !isNaN(item.confidence)) 
      ? item.confidence 
      : undefined,
    createdAt: validateDate(item.createdAt, 'createdAt'),
    updatedAt: validateDate(item.updatedAt, 'updatedAt'),
  }));
}

/**
 * 类型守卫：检查数据是否为 ApiAppResponse 类型
 */
export function isApiAppResponse(data: unknown[]): data is ApiAppResponse[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  const firstItem = data[0] as Record<string, unknown>;
  return (
    typeof firstItem === 'object' &&
    firstItem !== null &&
    'category' in firstItem &&
    typeof firstItem.category === 'object'
  );
}

/**
 * 安全的数据转换函数，自动检测数据类型并转换
 */
export function safeConvertToAppEntry(data: unknown[]): AppEntry[] {
  if (isApiAppResponse(data)) {
    return convertApiToAppEntry(data);
  } else {
    // 假设是 MockApp 类型
    return convertMockToAppEntry(data as MockApp[]);
  }
}