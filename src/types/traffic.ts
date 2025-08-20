// 数据库模型类型（基于Prisma Schema）
// 简化版本，移除了认证相关字段
export interface TrafficDyeingRuleDB {
  id: string;
  name: string;
  appType: string;
  protocol: string;
  targetIp: string;
  priority: number;
  status: string;
  dyeResult: string | null;
  traceInfo: string | null;
  reportData: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  // 注意：createdBy字段已移除，因为API查询时不包含此字段
}

// 前端使用的规则类型（与mockData保持一致）
export interface TrafficRule {
  id: string;
  name: string;
  appType: 'web' | 'app' | 'api';
  protocol: 'http' | 'https' | 'tcp' | 'udp';
  targetIp: string;
  priority: number;
  status: 'active' | 'inactive' | 'processing';
  dyeResult?: string;
  traceInfo?: {
    path: string[];
    currentNode: string;
    status: 'success' | 'failed' | 'processing';
    latency: number;
  };
  reportData?: {
    totalRequests: number;
    dyedRequests: number;
    successRate: number;
    avgLatency: number;
    errorCount: number;
    peakHours: number[];
  };
  createTime: string;
  updateTime: string;
  lastExecuteTime?: string;
}

// 染色结果类型
export interface DyeResult {
  dyeId: string;
  status: string;
  startTime: string;
  endTime?: string;
  affectedRequests: number;
  dyeRate: number;
  message: string;
}

// 批量染色结果类型
export interface BatchDyeResult {
  success: boolean;
  message: string;
  data: {
    total: number;
    successCount: number;
    failedCount: number;
    results: (DyeResult & { success: boolean; ruleId: string; error?: string })[];
  };
}

// API查询参数类型
export interface TrafficQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: 'active' | 'inactive' | 'processing';
  appType?: 'web' | 'app' | 'api';
}

// API响应类型
export interface TrafficListResponse {
  data: TrafficDyeingRuleDB[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 表单数据类型
export interface TrafficRuleFormData {
  name: string;
  appType: 'web' | 'app' | 'api';
  protocol: 'http' | 'https' | 'tcp' | 'udp';
  targetIp: string;
  priority: number;
}

// 更新数据类型
export interface TrafficRuleUpdateData extends Partial<TrafficRuleFormData> {
  id: string;
}

// 统计数据类型
export interface TrafficStats {
  totalRules: number;
  activeRules: number;
  todayExecutions: number;
  successRate: number;
  totalTraffic: number;
  dyedTraffic: number;
  avgResponseTime: number;
  errorRate: number;
}

// 数据转换函数类型
export type DBToFrontendConverter = (dbRule: TrafficDyeingRuleDB) => TrafficRule;
