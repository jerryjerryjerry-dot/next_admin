/**
 * App Management 后端验证Schema
 * 基于共享验证规则的Zod Schema定义
 */

import { z } from "zod";
import {
  VALIDATION_PATTERNS,
  VALIDATION_CONSTANTS,
  ERROR_MESSAGES,
} from "~/lib/app-management/validation-rules";

/**
 * 应用创建Schema
 */
export const createAppSchema = z.object({
  appName: z.string()
    .min(VALIDATION_CONSTANTS.APP_NAME.MIN_LENGTH, ERROR_MESSAGES.REQUIRED('应用名称'))
    .max(VALIDATION_CONSTANTS.APP_NAME.MAX_LENGTH, 
         ERROR_MESSAGES.MAX_LENGTH('应用名称', VALIDATION_CONSTANTS.APP_NAME.MAX_LENGTH))
    .regex(VALIDATION_PATTERNS.APP_NAME, '应用名称只能包含字母、数字、中文、下划线和连字符'),

  appType: z.string()
    .min(1, ERROR_MESSAGES.CATEGORY_REQUIRED),

  ip: z.string()
    .regex(VALIDATION_PATTERNS.IP_ADDRESS, ERROR_MESSAGES.INVALID_IP)
    .optional()
    .or(z.literal('')),

  domain: z.string()
    .max(VALIDATION_CONSTANTS.DOMAIN.MAX_LENGTH, 
         ERROR_MESSAGES.MAX_LENGTH('域名', VALIDATION_CONSTANTS.DOMAIN.MAX_LENGTH))
    .regex(VALIDATION_PATTERNS.DOMAIN, ERROR_MESSAGES.INVALID_DOMAIN)
    .optional()
    .or(z.literal('')),

  url: z.string()
    .max(VALIDATION_CONSTANTS.URL.MAX_LENGTH, 
         ERROR_MESSAGES.MAX_LENGTH('URL', VALIDATION_CONSTANTS.URL.MAX_LENGTH))
    .regex(VALIDATION_PATTERNS.URL, ERROR_MESSAGES.INVALID_URL)
    .optional()
    .or(z.literal('')),

  status: z.enum(["active", "inactive"])
    .default("active"),

  isBuiltIn: z.boolean()
    .default(false),

  confidence: z.number()
    .min(VALIDATION_CONSTANTS.CONFIDENCE.MIN, 
         ERROR_MESSAGES.RANGE('置信度', VALIDATION_CONSTANTS.CONFIDENCE.MIN, VALIDATION_CONSTANTS.CONFIDENCE.MAX))
    .max(VALIDATION_CONSTANTS.CONFIDENCE.MAX, 
         ERROR_MESSAGES.RANGE('置信度', VALIDATION_CONSTANTS.CONFIDENCE.MIN, VALIDATION_CONSTANTS.CONFIDENCE.MAX))
    .optional(),
}).transform((data) => {
  // 数据预处理
  const processed = { ...data };
  
  // 清理空字符串
  if (processed.ip === '') processed.ip = undefined;
  if (processed.domain === '') processed.domain = undefined;
  if (processed.url === '') processed.url = undefined;
  
  return processed;
}).refine(
  (data) => data.ip || data.domain || data.url,
  {
    message: ERROR_MESSAGES.NETWORK_REQUIRED,
    path: ["networkConfig"],
  }
);

/**
 * 应用更新Schema
 */
export const updateAppSchema = z.object({
  id: z.string().min(1, "应用ID不能为空"),
}).merge(createAppSchema);

/**
 * 应用查询Schema
 */
export const getAppsSchema = z.object({
  categoryId: z.string().optional(),
  isBuiltIn: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["appName", "createdAt", "updatedAt", "confidence"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * 批量删除Schema
 */
export const batchDeleteSchema = z.object({
  ids: z.array(z.string().min(1))
    .min(1, "至少选择一个应用")
    .max(100, "一次最多删除100个应用"),
});

/**
 * 导入应用Schema
 */
export const importAppsSchema = z.object({
  apps: z.array(createAppSchema)
    .min(1, "至少导入一个应用")
    .max(1000, "一次最多导入1000个应用"),
  overwrite: z.boolean().default(false),
  skipDuplicates: z.boolean().default(true),
});

/**
 * 分类相关Schema
 */
export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "分类名称不能为空").max(50, "分类名称不能超过50个字符"),
  parentId: z.string().optional(),
  level: z.number().min(0).max(5),
  isLeaf: z.boolean(),
  description: z.string().optional(),
});

/**
 * 创建分类Schema
 */
export const createCategorySchema = categorySchema.omit({ id: true });

/**
 * AI建议Schema
 */
export const aiSuggestionSchema = z.object({
  id: z.string().min(1),
  appName: z.string().min(1),
  suggestedCategory: z.string().min(1),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  createdAt: z.date(),
});

/**
 * 处理AI建议Schema
 */
export const processAiSuggestionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["accept", "reject"]),
  customCategory: z.string().optional(),
});

/**
 * 搜索Schema
 */
export const searchAppsSchema = z.object({
  query: z.string().min(1, "搜索关键词不能为空"),
  type: z.enum(["name", "ip", "domain", "url", "category"]).default("name"),
  categoryId: z.string().optional(),
  isBuiltIn: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

/**
 * 统计信息Schema
 */
export const statsSchema = z.object({
  timeRange: z.enum(["day", "week", "month", "year"]).default("month"),
  categoryId: z.string().optional(),
  groupBy: z.enum(["category", "status", "confidence", "date"]).default("category"),
});

/**
 * 导出配置Schema
 */
export const exportConfigSchema = z.object({
  format: z.enum(["json", "csv", "xlsx"]).default("json"),
  includeFields: z.array(z.string()).optional(),
  filters: getAppsSchema.omit({ page: true, limit: true }).optional(),
  includeMeta: z.boolean().default(true),
});

/**
 * Schema类型导出
 */
export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type GetAppsInput = z.infer<typeof getAppsSchema>;
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>;
export type ImportAppsInput = z.infer<typeof importAppsSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type AiSuggestionInput = z.infer<typeof aiSuggestionSchema>;
export type ProcessAiSuggestionInput = z.infer<typeof processAiSuggestionSchema>;
export type SearchAppsInput = z.infer<typeof searchAppsSchema>;
export type StatsInput = z.infer<typeof statsSchema>;
export type ExportConfigInput = z.infer<typeof exportConfigSchema>;

/**
 * 验证工具函数
 */
export class SchemaValidator {
  /**
   * 验证并清理应用数据
   */
  static validateAppData(data: unknown): CreateAppInput {
    return createAppSchema.parse(data);
  }

  /**
   * 安全验证（返回结果而不抛出异常）
   */
  static safeValidateAppData(data: unknown): { 
    success: boolean; 
    data?: CreateAppInput; 
    error?: z.ZodError 
  } {
    const result = createAppSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: !result.success ? result.error : undefined,
    };
  }

  /**
   * 获取验证错误的友好消息
   */
  static getValidationErrors(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    
    return errors;
  }

  /**
   * 验证部分数据（用于实时验证）
   */
  static validatePartialAppData(data: Partial<CreateAppInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const partialSchema = createAppSchema.partial();
    const result = partialSchema.safeParse(data);
    
    return {
      isValid: result.success,
      errors: result.success ? {} : this.getValidationErrors(result.error),
    };
  }
}
