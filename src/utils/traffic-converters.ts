import type { 
  TrafficDyeingRuleDB, 
  TrafficRule, 
  DBToFrontendConverter 
} from "~/types/traffic";

/**
 * 安全的枚举值验证
 */
function validateAppType(value: string): TrafficRule['appType'] {
  const validTypes = ['web', 'app', 'api'] as const;
  return validTypes.includes(value as TrafficRule['appType']) ? value as TrafficRule['appType'] : 'web';
}

function validateProtocol(value: string): TrafficRule['protocol'] {
  const validProtocols = ['http', 'https', 'tcp', 'udp'] as const;
  return validProtocols.includes(value as TrafficRule['protocol']) ? value as TrafficRule['protocol'] : 'http';
}

function validateStatus(value: string): TrafficRule['status'] {
  const validStatuses = ['active', 'inactive', 'processing'] as const;
  return validStatuses.includes(value as TrafficRule['status']) ? value as TrafficRule['status'] : 'active';
}

/**
 * 将数据库返回的数据转换为前端使用的TrafficRule类型
 */
export const convertDBToTrafficRule: DBToFrontendConverter = (dbRule: TrafficDyeingRuleDB): TrafficRule => {
  return {
    id: dbRule.id || '',
    name: dbRule.name || '',
    appType: validateAppType(dbRule.appType),
    protocol: validateProtocol(dbRule.protocol),
    targetIp: dbRule.targetIp || '',
    priority: typeof dbRule.priority === 'number' ? dbRule.priority : 50,
    status: validateStatus(dbRule.status),
    dyeResult: dbRule.dyeResult ?? undefined,
    traceInfo: dbRule.traceInfo ? safeJsonParse(dbRule.traceInfo) : undefined,
    reportData: dbRule.reportData ? safeJsonParse(dbRule.reportData) : undefined,
    createTime: dbRule.createdAt ? dbRule.createdAt.toISOString() : new Date().toISOString(),
    updateTime: dbRule.updatedAt ? dbRule.updatedAt.toISOString() : new Date().toISOString(),
    lastExecuteTime: undefined // 数据库中暂无此字段
  };
};

/**
 * 批量转换数据库数据到前端格式
 */
export const convertDBRulesToTrafficRules = (dbRules: TrafficDyeingRuleDB[]): TrafficRule[] => {
  if (!Array.isArray(dbRules)) {
    console.warn('convertDBRulesToTrafficRules: 输入不是数组', dbRules);
    return [];
  }
  
  return dbRules
    .filter(rule => rule && typeof rule === 'object' && rule.id) // 过滤无效数据
    .map(convertDBToTrafficRule);
};

/**
 * 安全的JSON解析，避免解析错误
 */
function safeJsonParse<T = unknown>(jsonString: string): T | undefined {
  if (!jsonString || typeof jsonString !== 'string') {
    return undefined;
  }
  
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    // 基础的类型检查，确保解析结果是对象
    if (parsed && typeof parsed === 'object') {
      return parsed as T;
    }
    return undefined;
  } catch (error) {
    console.warn('JSON解析失败:', error);
    return undefined;
  }
}

/**
 * 处理Promise，避免未捕获的Promise警告
 */
export const handlePromise = <T>(promise: Promise<T>): void => {
  void promise.catch((error) => {
    console.error('Promise执行失败:', error);
  });
};

/**
 * 安全的错误消息提取
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '发生未知错误';
};
