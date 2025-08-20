// API 响应的精确类型定义

// 从 mock 数据中提取的分类结构
export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  children: CategoryTreeNode[];
  appCount?: number;
}

// 简化的分类信息（API返回中包含的）
export interface CategoryInfo {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  parentId?: string | null;
  level?: number;
  appCount?: number;
  isLeaf?: boolean;
}

// Mock 数据中的原始应用结构
export interface MockApp {
  id: string;
  appName: string;
  appType: string;
  categoryPath: string;
  ip?: string;
  domain?: string;
  url?: string;
  status: string; // 注意：这里是 string，不是联合类型
  isBuiltIn: boolean;
  confidence?: number | null;
  createdAt: string;
  updatedAt: string;
}

// API 返回的应用数据（添加了 category 字段）
export interface ApiAppResponse extends MockApp {
  category: CategoryInfo;
}

// AI 建议的数据结构
export interface AISuggestion {
  id: string;
  ip?: string | null;
  domain?: string | null;
  url?: string | null;
  predictedType: string;
  confidence: number;
  reason: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// 前端组件使用的规范化类型
export interface AppEntry {
  id: string;
  appName: string;
  appType: string;
  categoryPath: string;
  ip?: string;
  domain?: string;
  url?: string;
  status: "active" | "inactive";
  isBuiltIn: boolean;
  confidence?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: CategoryInfo;
}

// 表单数据类型 - 使用统一的类型定义
// 注意：AppFormData已在 app-management/base.ts 中定义

// 搜索参数类型
export interface SearchParams {
  queryType: "ip" | "domain" | "url";
  queryValue: string;
}

// 数据转换工具函数类型
export type ApiToAppEntryConverter = (apiData: ApiAppResponse[]) => AppEntry[];
export type MockToAppEntryConverter = (mockData: MockApp[]) => AppEntry[];
