/**
 * App Management 类型定义入口文件
 * 统一导出所有app-management相关的类型定义
 */

// 基础类型
export type {
  AppStatus,
  NetworkType,
  FormMode,
  AppFormInput,
  AppFormData,
  AppCreatePayload,
  AppUpdatePayload,
  CategoryOption,
  AppEntity,
  FormField,
  FormFieldGroup,
} from './base';

// 验证相关类型
export type {
  ValidationResult,
  FieldValidationResult,
  FormValidationState,
  ValidationRule,
  ValidationConfig,
  ValidationRuleSet,
  FormValidator,
  ValidationEvent,
  ValidationMiddleware,
  AsyncValidationState,
  ValidationStrategy,
  ValidationContext,
} from './validation';

// 表单相关类型
export type {
  AppFormProps,
  AppFormState,
  AppFormActions,
  CustomFieldProps,
  SubmitButtonProps,
  CancelButtonProps,
  FormFieldProps,
  NetworkFieldProps,
  CategorySelectorProps,
  FormConfig,
  UseAppFormReturn,
  FormEvent,
  FormEventListener,
  FormMiddleware,
} from './form';

// 导出验证错误类
export { ValidationError } from './validation';

// 类型守卫函数
export function isAppFormInput(obj: any): obj is AppFormInput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.appName === 'string' &&
    typeof obj.categoryId === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.isBuiltIn === 'boolean'
  );
}

export function isValidationResult(obj: any): obj is ValidationResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isValid === 'boolean'
  );
}

export function isFormValidationState(obj: any): obj is FormValidationState {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isValid === 'boolean' &&
    typeof obj.isValidating === 'boolean' &&
    typeof obj.errors === 'object' &&
    typeof obj.warnings === 'object'
  );
}

// 常量定义
export const APP_FORM_DEFAULTS = {
  STATUS: 'active' as AppStatus,
  IS_BUILT_IN: false,
  NETWORK_TYPE: 'url' as NetworkType,
  VALIDATION_DEBOUNCE_MS: 300,
  AUTO_SAVE_INTERVAL_MS: 30000,
} as const;

export const FORM_FIELD_GROUPS = {
  BASIC: 'basic',
  NETWORK: 'network',
  ADVANCED: 'advanced',
} as const;

export const VALIDATION_STRATEGIES = {
  IMMEDIATE: 'immediate',
  DEBOUNCED: 'debounced',
  ON_BLUR: 'onBlur',
  ON_SUBMIT: 'onSubmit',
  PROGRESSIVE: 'progressive',
} as const;

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 表单字段联合类型
export type FormFieldName = keyof AppFormInput;

// 网络字段联合类型
export type NetworkFieldName = 'ip' | 'domain' | 'url';

// 验证结果映射类型
export type ValidationResultMap = {
  [K in FormFieldName]?: ValidationResult;
};

// 错误信息映射类型
export type ErrorMessageMap = {
  [K in FormFieldName]?: string;
};
