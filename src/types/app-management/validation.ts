/**
 * App Management 验证系统类型定义
 */

import type { AppFormInput } from './base';

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorCode?: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * 字段验证结果
 */
export interface FieldValidationResult extends ValidationResult {
  field: keyof AppFormInput;
  value: any;
}

/**
 * 表单验证状态
 */
export interface FormValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: Record<string, string>;      // 错误信息
  warnings: Record<string, string>;   // 警告信息
  fieldStates: Record<keyof AppFormInput, {
    isValid: boolean;
    isPending: boolean;
    error?: string;
    warning?: string;
    lastValidated?: Date;
  }>;
  globalErrors: string[];             // 全局错误（如网络配置）
}

/**
 * 验证规则定义
 */
export interface ValidationRule {
  field: keyof AppFormInput | 'networkConfig' | 'global';
  type: 'required' | 'pattern' | 'length' | 'range' | 'custom' | 'async';
  validator: (value: any, formData: AppFormInput) => ValidationResult | Promise<ValidationResult>;
  errorMessage: string;
  warningMessage?: string;
  priority?: number;  // 验证优先级，数字越小优先级越高
  dependencies?: (keyof AppFormInput)[];  // 依赖的其他字段
  debounceMs?: number;  // 防抖延迟（毫秒）
}

/**
 * 验证规则配置
 */
export interface ValidationConfig {
  // 字段规则
  appName: ValidationRuleSet;
  appType: ValidationRuleSet;
  categoryId: ValidationRuleSet;
  ip: ValidationRuleSet;
  domain: ValidationRuleSet;
  url: ValidationRuleSet;
  status: ValidationRuleSet;
  isBuiltIn: ValidationRuleSet;
  confidence: ValidationRuleSet;
  
  // 全局规则
  networkConfig: ValidationRuleSet;
  
  // 验证选项
  options: {
    validateOnChange: boolean;
    validateOnBlur: boolean;
    validateOnSubmit: boolean;
    debounceMs: number;
    showWarnings: boolean;
    stopOnFirstError: boolean;
  };
}

/**
 * 字段验证规则集
 */
export interface ValidationRuleSet {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any, formData: AppFormInput) => ValidationResult;
  asyncValidator?: (value: any, formData: AppFormInput) => Promise<ValidationResult>;
  errorMessages: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    custom?: string;
    async?: string;
  };
  warningMessages?: {
    [key: string]: string;
  };
}

/**
 * 验证器接口
 */
export interface FormValidator {
  validateField(field: keyof AppFormInput, value: any, formData: AppFormInput): Promise<FieldValidationResult>;
  validateForm(formData: AppFormInput): Promise<FormValidationState>;
  validateNetworkConfig(formData: AppFormInput): ValidationResult;
  addCustomRule(rule: ValidationRule): void;
  removeCustomRule(field: keyof AppFormInput, ruleType: string): void;
  setConfig(config: Partial<ValidationConfig>): void;
}

/**
 * 验证事件
 */
export type ValidationEvent = 
  | { type: 'FIELD_VALIDATION_START'; field: keyof AppFormInput; value: any }
  | { type: 'FIELD_VALIDATION_SUCCESS'; field: keyof AppFormInput; result: FieldValidationResult }
  | { type: 'FIELD_VALIDATION_ERROR'; field: keyof AppFormInput; error: string }
  | { type: 'FORM_VALIDATION_START'; formData: AppFormInput }
  | { type: 'FORM_VALIDATION_SUCCESS'; state: FormValidationState }
  | { type: 'FORM_VALIDATION_ERROR'; errors: string[] }
  | { type: 'VALIDATION_RESET' };

/**
 * 验证中间件
 */
export interface ValidationMiddleware {
  before?: (event: ValidationEvent) => ValidationEvent | null;
  after?: (event: ValidationEvent, result: any) => any;
}

/**
 * 验证错误类型
 */
export class ValidationError extends Error {
  constructor(
    public field: keyof AppFormInput,
    public code: string,
    message: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 异步验证状态
 */
export interface AsyncValidationState {
  isValidating: boolean;
  pendingFields: Set<keyof AppFormInput>;
  results: Map<keyof AppFormInput, FieldValidationResult>;
  errors: Map<keyof AppFormInput, string>;
}

/**
 * 验证策略
 */
export type ValidationStrategy = 
  | 'immediate'    // 立即验证
  | 'debounced'    // 防抖验证
  | 'onBlur'       // 失焦验证
  | 'onSubmit'     // 提交时验证
  | 'progressive'; // 渐进式验证

/**
 * 验证上下文
 */
export interface ValidationContext {
  formMode: 'create' | 'edit';
  userId?: string;
  permissions?: string[];
  environment: 'development' | 'production' | 'test';
  locale: string;
}
