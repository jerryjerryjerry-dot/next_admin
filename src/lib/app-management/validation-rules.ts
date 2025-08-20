/**
 * App Management 统一验证规则定义
 * 前后端共享的验证规则，确保一致性
 */

import type { 
  ValidationRuleSet, 
  ValidationConfig, 
  AppFormInput 
} from '~/types/app-management';

/**
 * 正则表达式常量
 */
export const VALIDATION_PATTERNS = {
  // 应用名称：字母、数字、中文、下划线、连字符
  APP_NAME: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
  
  // IP地址 (IPv4)
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  
  // 域名
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // URL (支持http/https)
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // 宽松的URL (可以自动添加协议)
  URL_LOOSE: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

/**
 * 验证常量
 */
export const VALIDATION_CONSTANTS = {
  APP_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  CONFIDENCE: {
    MIN: 0,
    MAX: 100,
  },
  DOMAIN: {
    MAX_LENGTH: 255,
  },
  URL: {
    MAX_LENGTH: 2048,
  },
} as const;

/**
 * 错误消息模板
 */
export const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field}不能为空`,
  MIN_LENGTH: (field: string, min: number) => `${field}至少需要${min}个字符`,
  MAX_LENGTH: (field: string, max: number) => `${field}不能超过${max}个字符`,
  PATTERN: (field: string) => `${field}格式不正确`,
  RANGE: (field: string, min: number, max: number) => `${field}必须在${min}-${max}之间`,
  NETWORK_REQUIRED: '至少需要填写IP地址、域名或URL中的一个',
  INVALID_IP: '请输入有效的IP地址',
  INVALID_DOMAIN: '请输入有效的域名',
  INVALID_URL: '请输入有效的URL地址',
  CATEGORY_REQUIRED: '必须选择应用分类',
  CONFIDENCE_RANGE: '置信度必须在0-100之间',
} as const;

/**
 * 应用管理验证规则配置
 */
export const APP_VALIDATION_RULES: ValidationConfig = {
  // 应用名称
  appName: {
    required: true,
    minLength: VALIDATION_CONSTANTS.APP_NAME.MIN_LENGTH,
    maxLength: VALIDATION_CONSTANTS.APP_NAME.MAX_LENGTH,
    pattern: VALIDATION_PATTERNS.APP_NAME,
    errorMessages: {
      required: ERROR_MESSAGES.REQUIRED('应用名称'),
      minLength: ERROR_MESSAGES.MIN_LENGTH('应用名称', VALIDATION_CONSTANTS.APP_NAME.MIN_LENGTH),
      maxLength: ERROR_MESSAGES.MAX_LENGTH('应用名称', VALIDATION_CONSTANTS.APP_NAME.MAX_LENGTH),
      pattern: '应用名称只能包含字母、数字、中文、下划线和连字符',
    },
  },

  // 应用类型
  appType: {
    required: true,
    errorMessages: {
      required: ERROR_MESSAGES.REQUIRED('应用类型'),
    },
  },

  // 分类ID
  categoryId: {
    required: true,
    errorMessages: {
      required: ERROR_MESSAGES.CATEGORY_REQUIRED,
    },
  },

  // IP地址
  ip: {
    pattern: VALIDATION_PATTERNS.IP_ADDRESS,
    errorMessages: {
      pattern: ERROR_MESSAGES.INVALID_IP,
    },
  },

  // 域名
  domain: {
    maxLength: VALIDATION_CONSTANTS.DOMAIN.MAX_LENGTH,
    pattern: VALIDATION_PATTERNS.DOMAIN,
    errorMessages: {
      maxLength: ERROR_MESSAGES.MAX_LENGTH('域名', VALIDATION_CONSTANTS.DOMAIN.MAX_LENGTH),
      pattern: ERROR_MESSAGES.INVALID_DOMAIN,
    },
  },

  // URL
  url: {
    maxLength: VALIDATION_CONSTANTS.URL.MAX_LENGTH,
    pattern: VALIDATION_PATTERNS.URL,
    errorMessages: {
      maxLength: ERROR_MESSAGES.MAX_LENGTH('URL', VALIDATION_CONSTANTS.URL.MAX_LENGTH),
      pattern: ERROR_MESSAGES.INVALID_URL,
    },
  },

  // 状态
  status: {
    required: true,
    errorMessages: {
      required: ERROR_MESSAGES.REQUIRED('状态'),
    },
  },

  // 是否内置
  isBuiltIn: {
    errorMessages: {},
  },

  // 置信度
  confidence: {
    min: VALIDATION_CONSTANTS.CONFIDENCE.MIN,
    max: VALIDATION_CONSTANTS.CONFIDENCE.MAX,
    errorMessages: {
      min: ERROR_MESSAGES.RANGE('置信度', VALIDATION_CONSTANTS.CONFIDENCE.MIN, VALIDATION_CONSTANTS.CONFIDENCE.MAX),
      max: ERROR_MESSAGES.RANGE('置信度', VALIDATION_CONSTANTS.CONFIDENCE.MIN, VALIDATION_CONSTANTS.CONFIDENCE.MAX),
    },
  },

  // 网络配置全局验证
  networkConfig: {
    customValidator: (value: any, formData: AppFormInput) => {
      const hasNetwork = !!(formData.ip?.trim() || formData.domain?.trim() || formData.url?.trim());
      return {
        isValid: hasNetwork,
        errorMessage: hasNetwork ? undefined : ERROR_MESSAGES.NETWORK_REQUIRED,
      };
    },
    errorMessages: {
      custom: ERROR_MESSAGES.NETWORK_REQUIRED,
    },
  },

  // 验证选项
  options: {
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
    showWarnings: true,
    stopOnFirstError: false,
  },
};

/**
 * 字段验证函数
 */
export class FieldValidator {
  /**
   * 验证必填字段
   */
  static validateRequired(value: any, fieldName: string): { isValid: boolean; errorMessage?: string } {
    const isEmpty = value === undefined || value === null || 
                   (typeof value === 'string' && value.trim() === '') ||
                   (Array.isArray(value) && value.length === 0);
    
    return {
      isValid: !isEmpty,
      errorMessage: isEmpty ? ERROR_MESSAGES.REQUIRED(fieldName) : undefined,
    };
  }

  /**
   * 验证字符串长度
   */
  static validateLength(
    value: string,
    options: { min?: number; max?: number },
    fieldName: string
  ): { isValid: boolean; errorMessage?: string } {
    if (!value) return { isValid: true };

    const length = value.trim().length;
    
    if (options.min !== undefined && length < options.min) {
      return {
        isValid: false,
        errorMessage: ERROR_MESSAGES.MIN_LENGTH(fieldName, options.min),
      };
    }
    
    if (options.max !== undefined && length > options.max) {
      return {
        isValid: false,
        errorMessage: ERROR_MESSAGES.MAX_LENGTH(fieldName, options.max),
      };
    }
    
    return { isValid: true };
  }

  /**
   * 验证正则表达式
   */
  static validatePattern(
    value: string,
    pattern: RegExp,
    errorMessage: string
  ): { isValid: boolean; errorMessage?: string } {
    if (!value) return { isValid: true };

    const isValid = pattern.test(value.trim());
    return {
      isValid,
      errorMessage: isValid ? undefined : errorMessage,
    };
  }

  /**
   * 验证数值范围
   */
  static validateRange(
    value: number,
    options: { min?: number; max?: number },
    fieldName: string
  ): { isValid: boolean; errorMessage?: string } {
    if (value === undefined || value === null) return { isValid: true };

    if (options.min !== undefined && value < options.min) {
      return {
        isValid: false,
        errorMessage: ERROR_MESSAGES.RANGE(fieldName, options.min, options.max || Infinity),
      };
    }
    
    if (options.max !== undefined && value > options.max) {
      return {
        isValid: false,
        errorMessage: ERROR_MESSAGES.RANGE(fieldName, options.min || -Infinity, options.max),
      };
    }
    
    return { isValid: true };
  }

  /**
   * 验证IP地址
   */
  static validateIP(value: string): { isValid: boolean; errorMessage?: string } {
    if (!value) return { isValid: true };
    
    return this.validatePattern(value, VALIDATION_PATTERNS.IP_ADDRESS, ERROR_MESSAGES.INVALID_IP);
  }

  /**
   * 验证域名
   */
  static validateDomain(value: string): { isValid: boolean; errorMessage?: string } {
    if (!value) return { isValid: true };
    
    const lengthResult = this.validateLength(value, { max: VALIDATION_CONSTANTS.DOMAIN.MAX_LENGTH }, '域名');
    if (!lengthResult.isValid) return lengthResult;
    
    return this.validatePattern(value, VALIDATION_PATTERNS.DOMAIN, ERROR_MESSAGES.INVALID_DOMAIN);
  }

  /**
   * 验证URL
   */
  static validateURL(value: string): { isValid: boolean; errorMessage?: string } {
    if (!value) return { isValid: true };
    
    const lengthResult = this.validateLength(value, { max: VALIDATION_CONSTANTS.URL.MAX_LENGTH }, 'URL');
    if (!lengthResult.isValid) return lengthResult;
    
    return this.validatePattern(value, VALIDATION_PATTERNS.URL, ERROR_MESSAGES.INVALID_URL);
  }

  /**
   * 验证网络配置
   */
  static validateNetworkConfig(formData: AppFormInput): { isValid: boolean; errorMessage?: string } {
    const hasIP = formData.ip?.trim();
    const hasDomain = formData.domain?.trim();
    const hasURL = formData.url?.trim();
    
    const hasAnyNetwork = !!(hasIP || hasDomain || hasURL);
    
    return {
      isValid: hasAnyNetwork,
      errorMessage: hasAnyNetwork ? undefined : ERROR_MESSAGES.NETWORK_REQUIRED,
    };
  }
}

/**
 * 数据预处理工具
 */
export class DataPreprocessor {
  /**
   * 预处理URL - 自动添加协议
   */
  static preprocessURL(url: string): string {
    if (!url) return url;
    
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    
    // 如果已经有协议，直接返回
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    
    // 如果看起来像URL，自动添加https://
    if (VALIDATION_PATTERNS.URL_LOOSE.test(trimmed)) {
      return `https://${trimmed}`;
    }
    
    return trimmed;
  }

  /**
   * 清理空字符串字段
   */
  static cleanEmptyFields(data: AppFormInput): AppFormInput {
    const cleaned = { ...data };
    
    // 清理字符串字段的空值
    const stringFields: (keyof AppFormInput)[] = ['ip', 'domain', 'url'];
    
    stringFields.forEach(field => {
      if (typeof cleaned[field] === 'string' && cleaned[field]?.trim() === '') {
        (cleaned[field] as any) = undefined;
      }
    });
    
    return cleaned;
  }

  /**
   * 格式化表单数据
   */
  static formatFormData(data: AppFormInput): AppFormInput {
    let formatted = { ...data };
    
    // 预处理URL
    if (formatted.url) {
      formatted.url = this.preprocessURL(formatted.url);
    }
    
    // 清理空字段
    formatted = this.cleanEmptyFields(formatted);
    
    // 确保必填字段有值
    formatted.appName = formatted.appName?.trim() || '';
    formatted.categoryId = formatted.categoryId?.trim() || '';
    
    return formatted;
  }
}

/**
 * 验证规则工厂
 */
export class ValidationRuleFactory {
  /**
   * 创建字段验证规则
   */
  static createFieldRule(
    field: keyof AppFormInput,
    config: ValidationRuleSet
  ) {
    return (value: any, formData: AppFormInput) => {
      const results: Array<{ isValid: boolean; errorMessage?: string }> = [];
      
      // 必填验证
      if (config.required) {
        results.push(FieldValidator.validateRequired(value, field));
      }
      
      // 如果字段为空且不是必填，跳过后续验证
      if (!value && !config.required) {
        return { isValid: true };
      }
      
      // 长度验证
      if (typeof value === 'string' && (config.minLength || config.maxLength)) {
        results.push(FieldValidator.validateLength(
          value,
          { min: config.minLength, max: config.maxLength },
          field
        ));
      }
      
      // 数值范围验证
      if (typeof value === 'number' && (config.min !== undefined || config.max !== undefined)) {
        results.push(FieldValidator.validateRange(
          value,
          { min: config.min, max: config.max },
          field
        ));
      }
      
      // 正则表达式验证
      if (typeof value === 'string' && config.pattern) {
        const errorMessage = config.errorMessages.pattern || ERROR_MESSAGES.PATTERN(field);
        results.push(FieldValidator.validatePattern(value, config.pattern, errorMessage));
      }
      
      // 自定义验证
      if (config.customValidator) {
        results.push(config.customValidator(value, formData));
      }
      
      // 找到第一个错误
      const firstError = results.find(result => !result.isValid);
      
      return firstError || { isValid: true };
    };
  }
}
