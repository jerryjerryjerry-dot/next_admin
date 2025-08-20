/**
 * App Management 表单状态管理Hook
 * 统一的表单状态管理逻辑
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  AppFormData,
  AppFormInput,
  AppEntity,
  FormMode,
  UseAppFormReturn,
  AppFormState,
  AppFormActions,
  FormValidationState,
} from '~/types/app-management';

import { type AppFormValidator, ValidatorFactory, DebouncedValidator } from '~/lib/app-management/form-validator';
import { DataPreprocessor } from '~/lib/app-management/validation-rules';

/**
 * 初始化表单数据
 */
function initializeFormData(mode: FormMode, initialData?: AppEntity): AppFormData {
  if (mode === 'edit' && initialData) {
    return {
      appName: initialData.appName,
      appType: initialData.appType,
      categoryId: initialData.category?.id ?? '1',
      categoryName: initialData.category?.name,
      ip: initialData.ip ?? '',
      domain: initialData.domain ?? '',
      url: initialData.url ?? '',
      status: initialData.status,
      isBuiltIn: initialData.isBuiltIn,
      confidence: initialData.confidence,
      _formMeta: {
        isDirty: false,
        touchedFields: new Set(),
        lastModified: new Date(),
      },
    };
  }

  return {
    appName: '',
    appType: '',
    categoryId: '',
    categoryName: '',
    ip: '',
    domain: '',
    url: '',
    status: 'active',
    isBuiltIn: false,
    confidence: undefined,
    _formMeta: {
      isDirty: false,
      touchedFields: new Set(),
      lastModified: new Date(),
    },
  };
}

/**
 * 初始化验证状态
 */
function initializeValidationState(): FormValidationState {
  return {
    isValid: true,
    isValidating: false,
    errors: {},
    warnings: {},
    fieldStates: {
      appName: { isValid: true, isPending: false },
      appType: { isValid: true, isPending: false },
      categoryId: { isValid: true, isPending: false },
      ip: { isValid: true, isPending: false },
      domain: { isValid: true, isPending: false },
      url: { isValid: true, isPending: false },
      status: { isValid: true, isPending: false },
      isBuiltIn: { isValid: true, isPending: false },
      confidence: { isValid: true, isPending: false },
    },
    globalErrors: [],
  };
}

/**
 * App表单状态管理Hook
 */
export function useAppForm(
  mode: FormMode,
  initialData?: AppEntity,
  options?: {
    autoValidate?: boolean;
    debounceMs?: number;
    autoSave?: boolean;
    autoSaveInterval?: number;
    onAutoSave?: (data: AppFormInput) => void;
  }
): UseAppFormReturn {
  // 状态定义
  const [formData, setFormData] = useState<AppFormData>(() =>
    initializeFormData(mode, initialData)
  );
  
  const [originalData] = useState<AppFormData>(() =>
    initializeFormData(mode, initialData)
  );
  
  const [validation, setValidation] = useState<FormValidationState>(initializeValidationState);
  
  const [touchedFields, setTouchedFields] = useState<Set<keyof AppFormInput>>(new Set());
  
  const [focusedField, setFocusedField] = useState<keyof AppFormInput | undefined>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'network'])
  );
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [lastSaved, setLastSaved] = useState<Date>();

  // Refs
  const validatorRef = useRef<AppFormValidator>(ValidatorFactory.getDefault());
  const debouncedValidatorRef = useRef<DebouncedValidator>(
    new DebouncedValidator(validatorRef.current, options?.debounceMs ?? 300)
  );
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 计算属性
  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);
  const hasUnsavedChanges = isDirty && !isSubmitting;
  
  const canSubmit = validation.isValid && !isSubmitting && isDirty;
  const hasErrors = !validation.isValid || validation.globalErrors.length > 0;
  const hasWarnings = Object.keys(validation.warnings).length > 0;
  
  const changedFields = Object.keys(formData).filter(key => {
    const field = key as keyof AppFormInput;
    return formData[field] !== originalData[field];
  }) as (keyof AppFormInput)[];
  
  const completionPercentage = (() => {
    const requiredFields: (keyof AppFormInput)[] = ['appName', 'categoryId'];
    const networkFields: (keyof AppFormInput)[] = ['ip', 'domain', 'url'];
    
    let completed = 0;
    const total = requiredFields.length + 1; // +1 for network config
    
    // 检查必填字段
    requiredFields.forEach(field => {
      if (formData[field]?.toString().trim()) {
        completed++;
      }
    });
    
    // 检查网络配置（至少一个）
    if (networkFields.some(field => formData[field]?.toString().trim())) {
      completed++;
    }
    
    return Math.round((completed / total) * 100);
  })();
  
  const validationSummary = {
    errors: [
      ...validation.globalErrors,
      ...Object.values(validation.errors).filter(Boolean),
    ],
    warnings: Object.values(validation.warnings).filter(Boolean),
    fieldCount: Object.keys(validation.fieldStates).length,
    validFieldCount: Object.values(validation.fieldStates).filter(state => state.isValid).length,
  };

  // 表单操作
  const updateField = useCallback((field: keyof AppFormInput, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as never,
      _formMeta: {
        ...prev._formMeta!,
        isDirty: true,
        lastModified: new Date(),
      },
    }));
    
    setTouchedFields(prev => new Set(prev).add(field));
    
    // 自动验证
    if (options?.autoValidate !== false) {
      debouncedValidatorRef.current.validateField(
        field,
        value,
        formData as AppFormInput,
        (result) => {
          if (mountedRef.current) {
            setValidation(prev => ({
              ...prev,
              fieldStates: {
                ...prev.fieldStates,
                [field]: {
                  isValid: result.isValid,
                  isPending: false,
                  error: result.errorMessage,
                  lastValidated: new Date(),
                },
              },
              errors: {
                ...prev.errors,
                [field]: result.errorMessage ?? '',
              },
            }));
          }
        }
      );
    }
    
    // 自动保存
    if (options?.autoSave && options?.onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setAutoSaveStatus('saving');
          try {
            const processedData = DataPreprocessor.formatFormData(formData as AppFormInput);
            options.onAutoSave!(processedData);
            setAutoSaveStatus('saved');
            setLastSaved(new Date());
          } catch {
            setAutoSaveStatus('error');
          }
        }
      }, options?.autoSaveInterval ?? 30000);
    }
  }, [formData, options]);

  const updateMultipleFields = useCallback((updates: Partial<AppFormInput>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateField(field as keyof AppFormInput, value);
    });
  }, [updateField]);

  const resetForm = useCallback(() => {
    const resetData = initializeFormData(mode, initialData);
    setFormData(resetData);
    setValidation(initializeValidationState());
    setTouchedFields(new Set());
    setFocusedField(undefined);
    setIsSubmitting(false);
    setAutoSaveStatus('idle');
    
    // 清除防抖验证
    debouncedValidatorRef.current.cancelAll();
  }, [mode, initialData]);

  const updateFormData = useCallback((data: AppFormData) => {
    setFormData(data);
  }, []);

  const setFieldTouched = useCallback((field: keyof AppFormInput, touched = true) => {
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      if (touched) {
        newSet.add(field);
      } else {
        newSet.delete(field);
      }
      return newSet;
    });
  }, []);

  const setFieldFocused = useCallback((field?: keyof AppFormInput) => {
    setFocusedField(field);
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    // 这个方法主要用于外部重置dirty状态
    if (!dirty) {
      // 更新originalData为当前数据
      setFormData(prev => ({
        ...prev,
        _formMeta: {
          ...prev._formMeta!,
          isDirty: false,
        },
      }));
    }
  }, []);

  const validateField = useCallback(async (field: keyof AppFormInput) => {
    setValidation(prev => ({
      ...prev,
      fieldStates: {
        ...prev.fieldStates,
        [field]: {
          ...prev.fieldStates[field],
          isPending: true,
        },
      },
    }));

    try {
      const result = await validatorRef.current.validateField(
        field,
        formData[field],
        formData as AppFormInput
      );

      setValidation(prev => ({
        ...prev,
        fieldStates: {
          ...prev.fieldStates,
          [field]: {
            isValid: result.isValid,
            isPending: false,
            error: result.errorMessage,
            lastValidated: new Date(),
          },
        },
        errors: {
          ...prev.errors,
          [field]: result.errorMessage ?? '',
        },
      }));
    } catch {
      setValidation(prev => ({
        ...prev,
        fieldStates: {
          ...prev.fieldStates,
          [field]: {
            isValid: false,
            isPending: false,
            error: '验证失败',
            lastValidated: new Date(),
          },
        },
      }));
    }
  }, [formData]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    setValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const processedData = DataPreprocessor.formatFormData(formData as AppFormInput);
      const validationState = await validatorRef.current.validateForm(processedData);
      
      setValidation({
        ...validationState,
        isValidating: false,
      });

      return validationState.isValid;
    } catch {
      setValidation(prev => ({
        ...prev,
        isValidating: false,
        isValid: false,
        globalErrors: ['表单验证失败'],
      }));
      return false;
    }
  }, [formData]);

  const clearValidation = useCallback((field?: keyof AppFormInput) => {
    if (field) {
      setValidation(prev => ({
        ...prev,
        fieldStates: {
          ...prev.fieldStates,
          [field]: {
            isValid: true,
            isPending: false,
            error: undefined,
          },
        },
        errors: {
          ...prev.errors,
          [field]: '',
        },
      }));
    } else {
      setValidation(initializeValidationState());
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const submitForm = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      const isValid = await validateForm();
      if (!isValid) {
        throw new Error('表单验证失败');
      }
      
      // 这里实际的提交逻辑由外部组件处理
      // 这个方法主要是设置提交状态和执行验证
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm]);

  const saveAsDraft = useCallback(async (): Promise<void> => {
    setAutoSaveStatus('saving');
    
    try {
      const processedData = DataPreprocessor.formatFormData(formData as AppFormInput);
      
      if (options?.onAutoSave) {
        options.onAutoSave(processedData);
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
      }
    } catch {
      setAutoSaveStatus('error');
    }
  }, [formData, options]);

  // 清理Effect
  useEffect(() => {
    const debouncedValidator = debouncedValidatorRef.current;
    const autoSaveTimeout = autoSaveTimeoutRef.current;
    
    return () => {
      mountedRef.current = false;
      debouncedValidator.cancelAll();
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, []);

  // 返回状态和操作
  const state: AppFormState = {
    data: formData,
    originalData,
    isDirty,
    isSubmitting,
    hasUnsavedChanges,
    touchedFields,
    focusedField,
    validation,
    expandedSections,
    showAdvanced,
    autoSaveStatus,
    lastSaved,
  };

  const actions: AppFormActions = {
    updateField,
    updateMultipleFields,
    resetForm,
    updateFormData,
    setFieldTouched,
    setFieldFocused,
    setDirty,
    validateField,
    validateForm,
    clearValidation,
    toggleSection,
    toggleAdvanced,
    submitForm,
    saveAsDraft,
  };

  const computed = {
    canSubmit,
    hasErrors,
    hasWarnings,
    completionPercentage,
    changedFields,
    validationSummary,
  };

  return {
    state,
    actions,
    computed,
  };
}
