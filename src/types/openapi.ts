import { z } from "zod";

// ================== API分类相关 ==================
export const apiCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["enabled", "disabled"]),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;

// ================== API端点相关 ==================
export const apiEndpointSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  endpoint: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string(),
  requestSchema: z.string(),
  responseSchema: z.string(),
  deprecated: z.boolean(),
  rateLimit: z.number().optional(),
  requireAuth: z.boolean(),
  status: z.enum(["active", "inactive", "maintenance"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApiEndpoint = z.infer<typeof apiEndpointSchema>;

// ================== API密钥相关 ==================
export const apiKeySchema = z.object({
  id: z.string(),
  keyName: z.string(),
  purpose: z.string(),
  accessKeyId: z.string(),
  accessKeySecret: z.string(),
  permissions: z.string(), // JSON字符串
  quotaLimit: z.number().optional(),
  quotaUsed: z.number(),
  status: z.enum(["active", "inactive", "expired"]),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

// 创建密钥请求
export const createApiKeySchema = z.object({
  keyName: z.string().min(1, "密钥名称不能为空"),
  purpose: z.string().min(1, "用途描述不能为空"),
  permissions: z.array(z.string()).min(1, "至少选择一个权限"),
  quotaLimit: z.number().min(1, "配额限制必须大于0").optional(),
  expiresAt: z.date().optional(),
});

export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;

// 更新密钥请求
export const updateApiKeySchema = z.object({
  id: z.string(),
  keyName: z.string().min(1, "密钥名称不能为空").optional(),
  purpose: z.string().min(1, "用途描述不能为空").optional(),
  permissions: z.array(z.string()).min(1, "至少选择一个权限").optional(),
  quotaLimit: z.number().min(1, "配额限制必须大于0").optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  expiresAt: z.date().optional(),
});

export type UpdateApiKeyRequest = z.infer<typeof updateApiKeySchema>;

// ================== API调用日志相关 ==================
export const apiCallSchema = z.object({
  id: z.string(),
  apiKeyId: z.string(),
  endpointId: z.string(),
  method: z.string(),
  endpoint: z.string(),
  parameters: z.string().optional(), // JSON字符串
  response: z.string().optional(), // JSON字符串
  statusCode: z.number(),
  responseTime: z.number().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  userAgent: z.string().optional(),
  clientIp: z.string().optional(),
  createdAt: z.date(),
});

export type ApiCall = z.infer<typeof apiCallSchema>;

// 查询调用日志请求
export const getApiCallsSchema = z.object({
  apiKeyId: z.string().optional(),
  endpointId: z.string().optional(),
  success: z.boolean().optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type GetApiCallsRequest = z.infer<typeof getApiCallsSchema>;

// ================== API权限相关 ==================
export const apiPermissionSchema = z.object({
  category: z.string(), // 分类名称
  endpoints: z.array(z.string()), // 允许访问的端点
});

export type ApiPermission = z.infer<typeof apiPermissionSchema>;

// 预定义权限模板
export const API_PERMISSION_TEMPLATES = {
  readonly: [
    { category: "sdk-api", endpoints: ["versions"] },
    { category: "app-recognition", endpoints: ["rules"] },
    { category: "crossborder", endpoints: ["rules"] },
    { category: "customization", endpoints: ["status"] },
    { category: "external", endpoints: ["capability/registered", "statistics"] },
  ],
  standard: [
    { category: "sdk-api", endpoints: ["configs", "versions", "audit/logs"] },
    { category: "app-recognition", endpoints: ["rules", "realtime"] },
    { category: "crossborder", endpoints: ["rules", "realtime"] },
    { category: "customization", endpoints: ["status", "module/load"] },
    { category: "external", endpoints: ["connection/status", "capability/registered", "statistics"] },
  ],
  admin: [
    { category: "sdk-api", endpoints: ["configs", "versions", "audit/logs", "watermark/algorithms"] },
    { category: "app-recognition", endpoints: ["rules", "realtime", "encrypted", "ai/predict", "abnormal/stat"] },
    { category: "crossborder", endpoints: ["rules", "realtime", "strategy/status", "proxy/identify"] },
    { category: "customization", endpoints: ["status", "module/load", "disaster-recovery/status"] },
    { category: "external", endpoints: ["connection/status", "capability/registered", "statistics"] },
  ],
} as const;

// ================== API响应格式 ==================
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  code: z.number(),
  msg: z.string(),
  data: dataSchema,
});

export type ApiResponse<T = unknown> = {
  code: number;
  msg: string;
  data: T;
};

export const pagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  code: z.number(),
  msg: z.string(),
  data: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    items: z.array(itemSchema),
  }),
});

export type PagedResponse<T = unknown> = {
  code: number;
  msg: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: T[];
  };
};

// ================== API调用日志查询相关 ==================
export const getCallLogsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  apiKeyId: z.string().optional(),
  endpointId: z.string().optional(),
  success: z.boolean().optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
});

export type GetCallLogsRequest = z.infer<typeof getCallLogsSchema>;

// 调用日志统计
export const getStatsSchema = z.object({
  timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
  apiKeyId: z.string().optional(),
  endpointId: z.string().optional(),
});

export type GetStatsRequest = z.infer<typeof getStatsSchema>;

// API统计响应
export const apiStatsResponseSchema = z.object({
  totalCalls: z.number(),
  successfulCalls: z.number(),
  failedCalls: z.number(),
  successRate: z.number(),
  avgResponseTime: z.number(),
  topEndpoints: z.array(z.object({
    endpointId: z.string(),
    name: z.string().optional(),
    calls: z.number(),
  })),
  callsOverTime: z.array(z.object({
    createdAt: z.date(),
    count: z.number(),
  })),
});

export type ApiStatsResponse = z.infer<typeof apiStatsResponseSchema>;

// ================== 统计相关 ==================
export const apiStatsSchema = z.object({
  totalCalls: z.number(),
  successRate: z.number(),
  averageResponseTime: z.number(),
  dailyCallsData: z.array(z.object({
    date: z.string(),
    calls: z.number(),
    success: z.number(),
    failed: z.number(),
  })),
  topEndpoints: z.array(z.object({
    endpoint: z.string(),
    calls: z.number(),
    successRate: z.number(),
  })),
  recentErrors: z.array(z.object({
    endpoint: z.string(),
    error: z.string(),
    count: z.number(),
    lastOccurred: z.date(),
  })),
});

export type ApiStats = z.infer<typeof apiStatsSchema>;

// ================== 界面状态相关 ==================
export type TabValue = "keys" | "docs" | "monitor" | "system";

// API密钥列表行的类型（从API返回的已处理数据）
export interface ApiKeyTableRow {
  id: string;
  keyName: string;
  purpose: string;
  accessKeyId: string;
  accessKeySecret: string; // 在列表中已被遮蔽
  permissions: string; // JSON字符串
  permissionLabels: string[]; // 已解析的权限标签
  quotaLimit: number | null;
  quotaUsed: number;
  quotaUsagePercent: number; // 计算出的使用百分比
  status: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isExpired: boolean; // 计算出的过期状态
  // 用户信息
  userName?: string | null;
  userEmail?: string | null;
}

// API分类的界面类型（包含端点信息）
export interface ApiCategoryWithEndpoints {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  endpoints?: Array<{
    id: string;
    name: string;
    endpoint: string;
    method: string;
    status: string;
  }>;
}

// API端点详细信息类型
export interface ApiEndpointDetail {
  id: string;
  categoryId: string;
  name: string;
  endpoint: string;
  method: string;
  description: string;
  requestSchema: string | null;
  responseSchema: string | null;
  deprecated: boolean;
  rateLimit: number | null;
  requireAuth: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    icon: string | null;
    status: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// API调用日志表格行类型
export interface ApiCallTableRow {
  id: string;
  apiKeyId: string;
  endpointId: string;
  method: string;
  endpoint: string;
  parameters: string | null;
  response: string | null;
  statusCode: number;
  responseTime: number | null;
  success: boolean;
  errorMessage: string | null;
  userAgent: string | null;
  clientIp: string | null;
  createdAt: Date;
  apiKey?: {
    keyName: string;
  } | null;
  apiEndpoint?: {
    name: string;
    endpoint: string;
  } | null;
}

// 删除密钥请求类型
export const deleteApiKeySchema = z.string();
export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeySchema>;

// 切换密钥状态请求类型
export const toggleApiKeyStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "inactive"]),
});
export type ToggleApiKeyStatusRequest = z.infer<typeof toggleApiKeyStatusSchema>;

// ================== 操作相关 ==================
export const batchOperationSchema = z.object({
  ids: z.array(z.string()).min(1, "至少选择一个密钥"),
  operation: z.enum(["activate", "deactivate", "delete"]),
});

export type BatchOperationRequest = z.infer<typeof batchOperationSchema>;

// ================== 测试接口相关 ==================
export const testApiRequestSchema = z.object({
  accessKeyId: z.string(),
  endpoint: z.string(),
  method: z.string(),
  parameters: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
  clientIp: z.string().optional(),
});

export type TestApiRequest = z.infer<typeof testApiRequestSchema>;

export const testApiResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  responseTime: z.number(),
  response: z.unknown(),
  error: z.string().optional(),
});

export type TestApiResponse = z.infer<typeof testApiResponseSchema>;

// ================== 系统状态相关 ==================
export const systemModuleStatusSchema = z.object({
  moduleName: z.string(),
  status: z.enum(["healthy", "warning", "error", "maintenance"]),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  connections: z.number(),
  lastChecked: z.date(),
  details: z.record(z.unknown()).optional(),
});

export type SystemModuleStatus = z.infer<typeof systemModuleStatusSchema>;

// 灾难恢复相关类型
export const disasterRecoverySchema = z.object({
  currentNode: z.string(),
  standbyNodes: z.array(z.string()),
  lastSwitchTime: z.string(),
  switchHistory: z.array(z.object({
    time: z.string(),
    from: z.string(),
    to: z.string(),
    reason: z.string(),
    status: z.string(),
  })),
  nodeHealth: z.array(z.object({
    name: z.string(),
    status: z.string(),
    latency: z.string(),
    load: z.string(),
  })),
});

export type DisasterRecovery = z.infer<typeof disasterRecoverySchema>;

export const externalConnectionSchema = z.object({
  systemId: z.string(),
  name: z.string(),
  status: z.enum(["connected", "disconnected", "error"]),
  lastSyncTime: z.date(),
  error: z.string().nullable(),
});

export type ExternalConnection = z.infer<typeof externalConnectionSchema>;

export const systemStatusSchema = z.object({
  overall: z.enum(["healthy", "warning", "error", "maintenance"]),
  modules: z.array(systemModuleStatusSchema),
  disasterRecovery: disasterRecoverySchema,
  externalConnections: z.array(externalConnectionSchema),
  statistics: z.object({
    totalKeys: z.number(),
    activeKeys: z.number(),
    totalCalls: z.number(),
    recentCalls: z.number(),
    uptime: z.string(),
    responseTime: z.string(),
  }),
});

export type SystemStatus = z.infer<typeof systemStatusSchema>;

// UI 组件使用的系统状态类型
export interface SystemStatusUI {
  modules?: SystemModuleStatus[];
  disasterRecovery?: DisasterRecovery;
  externalConnections?: ExternalConnection[];
  overallStatus?: string;
  systemLoad?: number;
  activeConnections?: number;
  uptime?: number;
}