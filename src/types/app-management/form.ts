/**
 * App Management 表单组件类型定义
 */

import type { ReactNode } from 'react';
import type { 
  AppFormInput, 
  AppFormData, 
  CategoryOption, 
  FormMode, 
  AppEntity 
} from './base';
import type { 
  FormValidationState, 
  ValidationStrategy, 
  ValidationContext 
} from './validation';

/**
 * 表单Props接口
 */
export interface AppFormProps {
  // 基础配置
  mode: FormMode;
  initialData?: AppEntity;
  
  // 数据和事件
  onSubmit: (data: AppFormInput) => void | Promise<void>;
  onCancel?: () => void;
  onChange?: (data: AppFormData) => void;
  onValidationChange?: (state: FormValidationState) => void;
  
  // 选项数据
  categories: CategoryOption[];
  
  // 状态
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  
  // UI配置
  showAdvancedFields?: boolean;
  showValidationSummary?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // 毫秒
  
  // 验证配置
  validationStrategy?: ValidationStrategy;
  validationContext?: ValidationContext;
  
  // 自定义渲染
  renderCustomField?: (field: string, props: CustomFieldProps) => ReactNode;
  renderSubmitButton?: (props: SubmitButtonProps) => ReactNode;
  renderCancelButton?: (props: CancelButtonProps) => ReactNode;
  
  // 样式
  className?: string;
  containerClassName?: string;
  fieldGroupClassName?: string;
}

/**
 * 表单状态接口
 */
export interface AppFormState {
  // 数据状态
  data: AppFormData;
  originalData: AppFormData;
  
  // 交互状态
  isDirty: boolean;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  
  // 字段状态
  touchedFields: Set<keyof AppFormInput>;
  focusedField?: keyof AppFormInput;
  
  // 验证状态
  validation: FormValidationState;
  
  // UI状态
  expandedSections: Set<string>;
  showAdvanced: boolean;
  
  // 自动保存
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}

/**
 * 表单操作接口
 */
export interface AppFormActions {
  // 数据操作
  updateField: (field: keyof AppFormInput, value: any) => void;
  updateMultipleFields: (updates: Partial<AppFormInput>) => void;
  resetForm: () => void;
  updateFormData: (data: AppFormData) => void;
  
  // 状态操作
  setFieldTouched: (field: keyof AppFormInput, touched?: boolean) => void;
  setFieldFocused: (field?: keyof AppFormInput) => void;
  setDirty: (dirty: boolean) => void;
  
  // 验证操作
  validateField: (field: keyof AppFormInput) => Promise<void>;
  validateForm: () => Promise<boolean>;
  clearValidation: (field?: keyof AppFormInput) => void;
  
  // UI操作
  toggleSection: (section: string) => void;
  toggleAdvanced: () => void;
  
  // 提交操作
  submitForm: () => Promise<void>;
  saveAsDraft: () => Promise<void>;
}

/**
 * 自定义字段Props
 */
export interface CustomFieldProps {
  field: keyof AppFormInput;
  value: any;
  error?: string;
  warning?: string;
  onChange: (value: any) => void;
  onBlur: () => void;
  onFocus: () => void;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  placeholder?: string;
  description?: string;
}

/**
 * 提交按钮Props
 */
export interface SubmitButtonProps {
  loading: boolean;
  disabled: boolean;
  isValid: boolean;
  isDirty: boolean;
  onSubmit: () => void;
  children?: ReactNode;
}

/**
 * 取消按钮Props
 */
export interface CancelButtonProps {
  hasUnsavedChanges: boolean;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * 字段组件Props
 */
export interface FormFieldProps {
  field: keyof AppFormInput;
  label: string;
  value: any;
  error?: string;
  warning?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  description?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
}

/**
 * 网络配置字段Props
 */
export interface NetworkFieldProps extends FormFieldProps {
  networkType: 'ip' | 'domain' | 'url';
  showTypeSwitch?: boolean;
  onTypeChange?: (type: 'ip' | 'domain' | 'url') => void;
}

/**
 * 分类选择器Props
 */
export interface CategorySelectorProps {
  value: string;
  options: CategoryOption[];
  onChange: (categoryId: string) => void;
  onCategoryLoad?: () => void;
  loading?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showPath?: boolean;
  allowCreate?: boolean;
  onCreateCategory?: (name: string, parentId?: string) => void;
}

/**
 * 表单配置接口
 */
export interface FormConfig {
  // 字段配置
  fields: {
    [K in keyof AppFormInput]: {
      show: boolean;
      required: boolean;
      readonly: boolean;
      order: number;
      group: 'basic' | 'network' | 'advanced';
      customComponent?: string;
    };
  };
  
  // 组配置
  groups: {
    basic: { title: string; description?: string; expanded: boolean; };
    network: { title: string; description?: string; expanded: boolean; };
    advanced: { title: string; description?: string; expanded: boolean; };
  };
  
  // 行为配置
  behavior: {
    autoSave: boolean;
    autoSaveInterval: number;
    showUnsavedWarning: boolean;
    validateOnChange: boolean;
    validateOnBlur: boolean;
    submitOnEnter: boolean;
  };
  
  // UI配置
  ui: {
    layout: 'vertical' | 'horizontal' | 'compact';
    showValidationSummary: boolean;
    showProgress: boolean;
    showFieldDescriptions: boolean;
    stickyButtons: boolean;
  };
}

/**
 * 表单Hook返回类型
 */
export interface UseAppFormReturn {
  // 状态
  state: AppFormState;
  
  // 操作
  actions: AppFormActions;
  
  // 计算属性
  computed: {
    canSubmit: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
    completionPercentage: number;
    changedFields: (keyof AppFormInput)[];
    validationSummary: {
      errors: string[];
      warnings: string[];
      fieldCount: number;
      validFieldCount: number;
    };
  };
}

/**
 * 表单事件类型
 */
export type FormEvent = 
  | { type: 'FIELD_CHANGE'; field: keyof AppFormInput; value: any; oldValue: any }
  | { type: 'FIELD_FOCUS'; field: keyof AppFormInput }
  | { type: 'FIELD_BLUR'; field: keyof AppFormInput }
  | { type: 'FORM_SUBMIT'; data: AppFormInput }
  | { type: 'FORM_RESET' }
  | { type: 'FORM_CANCEL' }
  | { type: 'AUTO_SAVE'; data: AppFormInput }
  | { type: 'VALIDATION_CHANGE'; state: FormValidationState };

/**
 * 表单事件监听器
 */
export type FormEventListener = (event: FormEvent) => void;

/**
 * 表单中间件
 */
export interface FormMiddleware {
  before?: (event: FormEvent) => FormEvent | null;
  after?: (event: FormEvent, result: any) => any;
}
