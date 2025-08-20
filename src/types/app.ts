// 统一的应用条目类型定义
export interface AppEntry {
  id: string;
  appName: string;
  appType: string;
  categoryPath: string;
  ip?: string | null;
  domain?: string | null;
  url?: string | null;
  status: "active" | "inactive";
  isBuiltIn: boolean;
  confidence?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    parentId?: string | null;
    level?: number;
    appCount?: number;
    isLeaf?: boolean;
  };
}

// 搜索参数类型
export interface SearchParams {
  queryType: "ip" | "domain" | "url";
  queryValue: string;
}

// 表单数据类型
export interface AppFormData {
  appName: string;
  appType: string;
  ip?: string;
  domain?: string;
  url?: string;
  status: "active" | "inactive";
}
