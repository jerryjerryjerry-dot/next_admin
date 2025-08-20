/**
 * App Management 表单验证器
 * 统一的表单验证逻辑，支持同步和异步验证
 */

import type {
  AppFormInput,
  FormValidator,
  ValidationResult,
  FieldValidationResult,
  FormValidationState,
  ValidationConfig,
  ValidationRule,
} from '~/types/app-management';

import {
  APP_VALIDATION_RULES,
  FieldValidator,
  DataPreprocessor,
  ValidationRuleFactory,
} from './validation-rules';

/**
 * 应用表单验证器实现
 */
export class AppFormValidator implements FormValidator {
  private config: ValidationConfig;
  private customRules: Map<string, ValidationRule> = new Map();
  private validationCache: Map<string, FieldValidationResult> = new Map();
  
  constructor(config?: Partial<ValidationConfig>) {
    this.config = { ...APP_VALIDATION_RULES, ...config };
  }

  /**
   * 验证单个字段
   */
  async validateField(
    field: keyof AppFormInput,
    value: any,
    formData: AppFormInput
  ): Promise<FieldValidationResult> {
    try {
      // 生成缓存键
      const cacheKey = `${field}:${JSON.stringify(value)}:${JSON.stringify(formData)}`;
      
      // 检查缓存
      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey)!;
      }

      let result: ValidationResult;

      // 特殊字段验证
      switch (field) {
        case 'ip':
          result = FieldValidator.validateIP(value);
          break;
        case 'domain':
          result = FieldValidator.validateDomain(value);
          break;
        case 'url':
          result = FieldValidator.validateURL(value);
          break;
        default:
          // 使用配置的验证规则
          const fieldConfig = this.config[field];
          if (fieldConfig) {
            const validator = ValidationRuleFactory.createFieldRule(field, fieldConfig);
            result = validator(value, formData);
          } else {
            result = { isValid: true };
          }
      }

      // 检查自定义规则
      const customRuleKey = `${field}:custom`;
      if (this.customRules.has(customRuleKey)) {
        const customRule = this.customRules.get(customRuleKey)!;
        const customResult = await customRule.validator(value, formData);
        if (!customResult.isValid) {
          result = customResult;
        }
      }

      const fieldResult: FieldValidationResult = {
        field,
        value,
        ...result,
      };

      // 缓存结果
      this.validationCache.set(cacheKey, fieldResult);

      return fieldResult;
    } catch (error) {
      return {
        field,
        value,
        isValid: false,
        errorMessage: `验证字段${field}时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        errorCode: 'VALIDATION_ERROR',
      };
    }
  }

  /**
   * 验证整个表单
   */
  async validateForm(formData: AppFormInput): Promise<FormValidationState> {
    const state: FormValidationState = {
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

    try {
      // 预处理数据
      const processedData = DataPreprocessor.formatFormData(formData);

      // 验证所有字段
      const fieldValidationPromises = Object.keys(processedData).map(async (field) => {
        const fieldName = field as keyof AppFormInput;
        const value = processedData[fieldName];
        
        const result = await this.validateField(fieldName, value, processedData);
        
        state.fieldStates[fieldName] = {
          isValid: result.isValid,
          isPending: false,
          error: result.errorMessage,
          lastValidated: new Date(),
        };

        if (!result.isValid) {
          state.errors[field] = result.errorMessage || '验证失败';
          state.isValid = false;
        }

        return result;
      });

      // 等待所有字段验证完成
      await Promise.all(fieldValidationPromises);

      // 验证网络配置（全局验证）
      const networkResult = this.validateNetworkConfig(processedData);
      if (!networkResult.isValid) {
        state.globalErrors.push(networkResult.errorMessage || '网络配置验证失败');
        state.errors.networkConfig = networkResult.errorMessage || '网络配置验证失败';
        state.isValid = false;
      }

      // 执行自定义全局验证
      await this.executeCustomGlobalValidation(processedData, state);

    } catch (error) {
      state.isValid = false;
      state.globalErrors.push(
        `表单验证过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }

    return state;
  }

  /**
   * 验证网络配置
   */
  validateNetworkConfig(formData: AppFormInput): ValidationResult {
    return FieldValidator.validateNetworkConfig(formData);
  }

  /**
   * 添加自定义验证规则
   */
  addCustomRule(rule: ValidationRule): void {
    const key = `${rule.field}:${rule.type}`;
    this.customRules.set(key, rule);
    
    // 清除相关缓存
    this.clearFieldCache(rule.field as keyof AppFormInput);
  }

  /**
   * 移除自定义验证规则
   */
  removeCustomRule(field: keyof AppFormInput, ruleType: string): void {
    const key = `${field}:${ruleType}`;
    this.customRules.delete(key);
    
    // 清除相关缓存
    this.clearFieldCache(field);
  }

  /**
   * 设置验证配置
   */
  setConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 清除所有缓存
    this.clearCache();
  }

  /**
   * 清除验证缓存
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * 清除特定字段的缓存
   */
  private clearFieldCache(field: keyof AppFormInput): void {
    const keysToDelete = Array.from(this.validationCache.keys()).filter(key => 
      key.startsWith(`${field}:`)
    );
    
    keysToDelete.forEach(key => {
      this.validationCache.delete(key);
    });
  }

  /**
   * 执行自定义全局验证
   */
  private async executeCustomGlobalValidation(
    formData: AppFormInput,
    state: FormValidationState
  ): Promise<void> {
    const globalRules = Array.from(this.customRules.values()).filter(
      rule => rule.field === 'global'
    );

    for (const rule of globalRules) {
      try {
        const result = await rule.validator(formData, formData);
        
        if (!result.isValid) {
          state.globalErrors.push(result.errorMessage || '全局验证失败');
          state.isValid = false;
        }
      } catch (error) {
        state.globalErrors.push(
          `执行全局验证规则失败: ${error instanceof Error ? error.message : '未知错误'}`
        );
        state.isValid = false;
      }
    }
  }

  /**
   * 获取验证统计信息
   */
  getValidationStats(): {
    cacheSize: number;
    customRulesCount: number;
    lastCacheCleared?: Date;
  } {
    return {
      cacheSize: this.validationCache.size,
      customRulesCount: this.customRules.size,
    };
  }
}

/**
 * 验证器工厂
 */
export class ValidatorFactory {
  private static defaultValidator: AppFormValidator;

  /**
   * 获取默认验证器实例
   */
  static getDefault(): AppFormValidator {
    if (!this.defaultValidator) {
      this.defaultValidator = new AppFormValidator();
    }
    return this.defaultValidator;
  }

  /**
   * 创建自定义验证器
   */
  static create(config?: Partial<ValidationConfig>): AppFormValidator {
    return new AppFormValidator(config);
  }

  /**
   * 创建严格验证器（停止于第一个错误）
   */
  static createStrict(): AppFormValidator {
    return new AppFormValidator({
      ...APP_VALIDATION_RULES,
      options: {
        ...APP_VALIDATION_RULES.options,
        stopOnFirstError: true,
      },
    });
  }

  /**
   * 创建宽松验证器（只显示警告）
   */
  static createLenient(): AppFormValidator {
    return new AppFormValidator({
      ...APP_VALIDATION_RULES,
      options: {
        ...APP_VALIDATION_RULES.options,
        showWarnings: true,
        validateOnChange: false,
        validateOnBlur: false,
      },
    });
  }
}

/**
 * 防抖验证工具
 */
export class DebouncedValidator {
  private validator: AppFormValidator;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private defaultDelay: number;

  constructor(validator: AppFormValidator, defaultDelay = 300) {
    this.validator = validator;
    this.defaultDelay = defaultDelay;
  }

  /**
   * 防抖字段验证
   */
  validateField(
    field: keyof AppFormInput,
    value: any,
    formData: AppFormInput,
    callback: (result: FieldValidationResult) => void,
    delay = this.defaultDelay
  ): void {
    // 清除之前的定时器
    const existingTimeout = this.timeouts.get(field);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的定时器
    const timeout = setTimeout(async () => {
      try {
        const result = await this.validator.validateField(field, value, formData);
        callback(result);
      } catch (error) {
        callback({
          field,
          value,
          isValid: false,
          errorMessage: '验证过程中发生错误',
          errorCode: 'DEBOUNCE_ERROR',
        });
      } finally {
        this.timeouts.delete(field);
      }
    }, delay);

    this.timeouts.set(field, timeout);
  }

  /**
   * 防抖表单验证
   */
  validateForm(
    formData: AppFormInput,
    callback: (state: FormValidationState) => void,
    delay = this.defaultDelay
  ): void {
    // 清除之前的定时器
    const existingTimeout = this.timeouts.get('__form__');
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的定时器
    const timeout = setTimeout(async () => {
      try {
        const state = await this.validator.validateForm(formData);
        callback(state);
      } catch (error) {
        callback({
          isValid: false,
          isValidating: false,
          errors: { form: '表单验证失败' },
          warnings: {},
          fieldStates: {} as any,
          globalErrors: ['表单验证过程中发生错误'],
        });
      } finally {
        this.timeouts.delete('__form__');
      }
    }, delay);

    this.timeouts.set('__form__', timeout);
  }

  /**
   * 取消所有待执行的验证
   */
  cancelAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * 取消特定字段的验证
   */
  cancelField(field: keyof AppFormInput): void {
    const timeout = this.timeouts.get(field);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(field);
    }
  }
}
