/**
 * App Management 基础类型定义
 * 这是所有app-management相关类型的核心定义文件
 */

// 应用状态枚举
export type AppStatus = "active" | "inactive";

// 网络配置类型
export type NetworkType = "ip" | "domain" | "url";

// 表单模式
export type FormMode = "create" | "edit";

/**
 * 表单输入数据结构
 * 这是表单组件内部使用的标准数据结构
 */
export interface AppFormInput {
  // 基础信息
  appName: string;
  appType: string;
  categoryId: string;
  
  // 网络配置 (至少一个必填)
  ip?: string;
  domain?: string;
  url?: string;
  
  // 状态配置
  status: AppStatus;
  isBuiltIn: boolean;
  confidence?: number;
}

/**
 * 表单数据结构
 * 继承AppFormInput，添加UI专用字段
 */
export interface AppFormData extends AppFormInput {
  // UI专用字段
  categoryName?: string;      // 用于显示分类名称
  networkType?: NetworkType;  // 当前选择的网络类型
  _formMeta?: {
    isDirty: boolean;
    touchedFields: Set<keyof AppFormInput>;
    lastModified: Date;
  };
}

/**
 * API创建负载结构
 * 用于发送到后端的数据结构
 */
export interface AppCreatePayload {
  appName: string;
  appType: string;    // 对应categoryId，但保持后端字段名
  ip?: string;
  domain?: string;
  url?: string;
  status: AppStatus;
  isBuiltIn: boolean;
  confidence?: number;
}

/**
 * API更新负载结构
 */
export interface AppUpdatePayload extends AppCreatePayload {
  id: string;
}

/**
 * 分类选项结构
 */
export interface CategoryOption {
  id: string;
  name: string;
  path?: string;      // 分类路径，如 "开发工具/前端框架"
  level?: number;     // 层级深度
  isLeaf: boolean;    // 是否为叶子节点
  disabled?: boolean; // 是否禁用选择
}

/**
 * 应用实体结构 (从数据库返回)
 */
export interface AppEntity {
  id: string;
  appName: string;
  appType: string;
  ip?: string;
  domain?: string;
  url?: string;
  status: AppStatus;
  isBuiltIn: boolean;
  confidence?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: {
    id: string;
    name: string;
    path?: string;
  };
}

/**
 * 表单字段定义
 */
export interface FormField {
  name: keyof AppFormInput;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'number' | 'url';
  required: boolean;
  placeholder?: string;
  description?: string;
  group: 'basic' | 'network' | 'advanced';
}

/**
 * 表单字段组定义
 */
export interface FormFieldGroup {
  id: 'basic' | 'network' | 'advanced';
  title: string;
  description?: string;
  fields: FormField[];
  validation?: {
    dependencies?: string[];  // 依赖的其他组
    customRules?: string[];   // 自定义验证规则
  };
}
