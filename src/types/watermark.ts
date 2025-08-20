import { z } from "zod";

// ================== 水印策略相关 ==================
export const watermarkPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  fileTypes: z.string(), // JSON字符串
  sensitivity: z.enum(["high", "medium", "low"]),
  embedDepth: z.number().min(1).max(10),
  description: z.string().optional(),
  isDefault: z.boolean(),
  status: z.enum(["active", "disabled"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
});

export type WatermarkPolicy = z.infer<typeof watermarkPolicySchema>;

// 创建策略Schema
export const createPolicySchema = z.object({
  name: z.string().min(1, "策略名称不能为空").max(50, "策略名称过长"),
  fileTypes: z.array(z.string()).min(1, "至少选择一种文件类型"),
  sensitivity: z.enum(["high", "medium", "low"], {
    errorMap: () => ({ message: "请选择敏感度等级" })
  }),
  embedDepth: z.number().min(1, "嵌入深度最小为1").max(10, "嵌入深度最大为10"),
  description: z.string().optional(),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

// 更新策略Schema
export const updatePolicySchema = createPolicySchema.partial().extend({
  id: z.string(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

// 策略列表查询Schema
export const policyListSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  keyword: z.string().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  sensitivity: z.enum(["high", "medium", "low"]).optional(),
});

export type PolicyListInput = z.infer<typeof policyListSchema>;

// ================== 水印记录相关 ==================
export const watermarkRecordSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileHash: z.string().optional(),
  fileUrl: z.string(),
  operation: z.enum(["embed", "extract"]),
  policyId: z.string().optional(),
  watermarkText: z.string().optional(),
  taskId: z.string().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number().min(0).max(100),
  result: z.string().optional(), // JSON字符串
  metadata: z.string().optional(), // JSON字符串
  errorMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
});

export type WatermarkRecord = z.infer<typeof watermarkRecordSchema>;

// 嵌入水印Schema
export const embedWatermarkSchema = z.object({
  fileUrl: z.string().url("请提供有效的文件地址"),
  fileName: z.string().min(1, "文件名不能为空"),
  fileSize: z.number().min(1, "文件大小无效"),
  policyId: z.string().min(1, "请选择水印策略"),
  watermarkText: z.string().min(1, "水印文本不能为空").max(200, "水印文本过长"),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceInfo: z.string().optional(),
  }).optional(),
});

export type EmbedWatermarkInput = z.infer<typeof embedWatermarkSchema>;

// 提取水印Schema
export const extractWatermarkSchema = z.object({
  fileUrl: z.string().url("请提供有效的文件地址"),
  fileName: z.string().min(1, "文件名不能为空"),
  fileSize: z.number().min(1, "文件大小无效"),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceInfo: z.string().optional(),
  }).optional(),
});

export type ExtractWatermarkInput = z.infer<typeof extractWatermarkSchema>;

// 记录列表查询Schema
export const recordListSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  keyword: z.string().optional(),
  operation: z.enum(["embed", "extract"]).optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  policyId: z.string().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
});

export type RecordListInput = z.infer<typeof recordListSchema>;

// ================== 文件上传相关 ==================
export const uploadFileSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, "请选择有效的文件"),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

// ================== 统计数据相关 ==================
export const dashboardStatsSchema = z.object({
  todayEmbeds: z.number(),
  todayExtracts: z.number(),
  totalRecords: z.number(),
  successRate: z.number(),
  avgProcessTime: z.number(), // 秒
  weeklyTrend: z.array(z.object({
    date: z.string(),
    embeds: z.number(),
    extracts: z.number(),
  })),
  topPolicies: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ================== 外部API响应相关 ==================
export const externalApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown(),
  taskId: z.string().optional(),
});

export type ExternalApiResponse = z.infer<typeof externalApiResponseSchema>;

// ================== 常量定义 ==================
export const FILE_TYPES = [
  { value: "pdf", label: "PDF文档" },
  { value: "doc", label: "Word文档" },
  { value: "docx", label: "Word文档(新版)" },
  { value: "xls", label: "Excel表格" },
  { value: "xlsx", label: "Excel表格(新版)" },
  { value: "ppt", label: "PowerPoint演示" },
  { value: "pptx", label: "PowerPoint演示(新版)" },
] as const;

export const SENSITIVITY_LEVELS = [
  { value: "high", label: "高密级", color: "red" },
  { value: "medium", label: "中密级", color: "yellow" },
  { value: "low", label: "低密级", color: "green" },
] as const;

export const OPERATION_TYPES = [
  { value: "embed", label: "嵌入水印", icon: "Shield" },
  { value: "extract", label: "提取水印", icon: "Search" },
] as const;

export const STATUS_TYPES = [
  { value: "pending", label: "等待中", color: "gray" },
  { value: "processing", label: "处理中", color: "blue" },
  { value: "completed", label: "已完成", color: "green" },
  { value: "failed", label: "失败", color: "red" },
] as const;