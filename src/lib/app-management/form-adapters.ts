/**
 * App Management 数据适配器
 * 处理不同数据格式之间的转换
 */

import type {
  AppFormInput,
  AppFormData,
  AppCreatePayload,
  AppUpdatePayload,
  AppEntity,
  CategoryOption,
} from '~/types/app-management';

import { DataPreprocessor } from './validation-rules';

/**
 * 应用表单数据适配器
 */
export class AppFormAdapter {
  /**
   * 从API返回的实体转换为表单数据
   */
  static fromEntityToForm(entity: AppEntity): AppFormData {
    return {
      appName: entity.appName,
      appType: entity.appType,
      categoryId: entity.category?.id || '1',
      categoryName: entity.category?.name,
      ip: entity.ip || '',
      domain: entity.domain || '',
      url: entity.url || '',
      status: entity.status,
      isBuiltIn: entity.isBuiltIn,
      confidence: entity.confidence,
      networkType: this.determineNetworkType(entity),
      _formMeta: {
        isDirty: false,
        touchedFields: new Set(),
        lastModified: new Date(),
      },
    };
  }

  /**
   * 从表单数据转换为API创建负载
   */
  static fromFormToCreatePayload(formData: AppFormInput): AppCreatePayload {
    const processed = DataPreprocessor.formatFormData(formData);
    
    return {
      appName: processed.appName,
      appType: processed.categoryId,  // 后端使用appType字段
      ip: processed.ip,
      domain: processed.domain,
      url: processed.url,
      status: processed.status,
      isBuiltIn: processed.isBuiltIn,
      confidence: processed.confidence,
    };
  }

  /**
   * 从表单数据转换为API更新负载
   */
  static fromFormToUpdatePayload(id: string, formData: AppFormInput): AppUpdatePayload {
    const createPayload = this.fromFormToCreatePayload(formData);
    
    return {
      id,
      ...createPayload,
    };
  }

  /**
   * 从表单数据提取纯输入数据
   */
  static fromFormDataToInput(formData: AppFormData): AppFormInput {
    return {
      appName: formData.appName,
      appType: formData.appType,
      categoryId: formData.categoryId,
      ip: formData.ip,
      domain: formData.domain,
      url: formData.url,
      status: formData.status,
      isBuiltIn: formData.isBuiltIn,
      confidence: formData.confidence,
    };
  }

  /**
   * 从输入数据扩展为表单数据
   */
  static fromInputToFormData(input: AppFormInput, categoryName?: string): AppFormData {
    return {
      ...input,
      categoryName,
      networkType: this.determineNetworkTypeFromInput(input),
      _formMeta: {
        isDirty: false,
        touchedFields: new Set(),
        lastModified: new Date(),
      },
    };
  }

  /**
   * 批量转换实体为表单数据
   */
  static fromEntitiesToForms(entities: AppEntity[]): AppFormData[] {
    return entities.map(entity => this.fromEntityToForm(entity));
  }

  /**
   * 批量转换表单数据为创建负载
   */
  static fromFormsToCreatePayloads(forms: AppFormInput[]): AppCreatePayload[] {
    return forms.map(form => this.fromFormToCreatePayload(form));
  }

  /**
   * 合并表单数据（用于部分更新）
   */
  static mergeFormData(original: AppFormData, updates: Partial<AppFormInput>): AppFormData {
    return {
      ...original,
      ...updates,
      _formMeta: {
        ...original._formMeta!,
        isDirty: true,
        lastModified: new Date(),
      },
    };
  }

  /**
   * 确定网络类型（基于实体）
   */
  private static determineNetworkType(entity: AppEntity): 'ip' | 'domain' | 'url' | undefined {
    if (entity.url) return 'url';
    if (entity.domain) return 'domain';
    if (entity.ip) return 'ip';
    return undefined;
  }

  /**
   * 确定网络类型（基于输入）
   */
  private static determineNetworkTypeFromInput(input: AppFormInput): 'ip' | 'domain' | 'url' | undefined {
    if (input.url?.trim()) return 'url';
    if (input.domain?.trim()) return 'domain';
    if (input.ip?.trim()) return 'ip';
    return undefined;
  }

  /**
   * 验证转换后的数据完整性
   */
  static validateConversion(original: any, converted: any): {
    isValid: boolean;
    missingFields: string[];
    extraFields: string[];
  } {
    const originalKeys = Object.keys(original);
    const convertedKeys = Object.keys(converted);
    
    const missingFields = originalKeys.filter(key => !convertedKeys.includes(key));
    const extraFields = convertedKeys.filter(key => !originalKeys.includes(key));
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      extraFields,
    };
  }
}

/**
 * 分类数据适配器
 */
export class CategoryAdapter {
  /**
   * 从API树形结构转换为选项列表
   */
  static fromTreeToOptions(categories: any[], prefix = ''): CategoryOption[] {
    const options: CategoryOption[] = [];
    
    const processNode = (node: any, currentPrefix: string, level: number) => {
      const path = currentPrefix ? `${currentPrefix}/${node.name}` : node.name;
      
      // 添加当前节点（如果是叶子节点）
      if (node.isLeaf || !node.children || node.children.length === 0) {
        options.push({
          id: node.id,
          name: node.name,
          path,
          level,
          isLeaf: true,
          disabled: false,
        });
      }
      
      // 处理子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          processNode(child, path, level + 1);
        });
      }
    };
    
    categories.forEach(category => {
      processNode(category, prefix, 0);
    });
    
    return options.sort((a, b) => a.path!.localeCompare(b.path!));
  }

  /**
   * 从选项列表重建树形结构
   */
  static fromOptionsToTree(options: CategoryOption[]): any[] {
    const tree: any[] = [];
    const nodeMap = new Map<string, any>();
    
    // 创建所有节点
    options.forEach(option => {
      const node = {
        id: option.id,
        name: option.name,
        isLeaf: option.isLeaf,
        level: option.level || 0,
        children: [],
        _count: { appEntries: 0 },
      };
      nodeMap.set(option.id, node);
    });
    
    // 构建父子关系
    options.forEach(option => {
      const node = nodeMap.get(option.id);
      const pathParts = option.path?.split('/') || [];
      
      if (pathParts.length === 1) {
        // 根节点
        tree.push(node);
      } else {
        // 查找父节点
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentOption = options.find(opt => opt.path === parentPath);
        
        if (parentOption) {
          const parentNode = nodeMap.get(parentOption.id);
          if (parentNode) {
            parentNode.children.push(node);
          }
        }
      }
    });
    
    return tree;
  }

  /**
   * 查找分类路径
   */
  static findCategoryPath(categoryId: string, options: CategoryOption[]): string | undefined {
    const option = options.find(opt => opt.id === categoryId);
    return option?.path;
  }

  /**
   * 获取分类层级
   */
  static getCategoryLevel(categoryId: string, options: CategoryOption[]): number {
    const option = options.find(opt => opt.id === categoryId);
    return option?.level || 0;
  }

  /**
   * 获取子分类
   */
  static getChildCategories(parentId: string, options: CategoryOption[]): CategoryOption[] {
    const parent = options.find(opt => opt.id === parentId);
    if (!parent?.path) return [];
    
    return options.filter(opt => 
      opt.path?.startsWith(parent.path + '/') && 
      opt.level === (parent.level || 0) + 1
    );
  }

  /**
   * 过滤可选分类（排除禁用的和非叶子节点）
   */
  static getSelectableCategories(options: CategoryOption[]): CategoryOption[] {
    return options.filter(opt => opt.isLeaf && !opt.disabled);
  }
}

/**
 * 导入导出适配器
 */
export class ImportExportAdapter {
  /**
   * 导出应用数据为JSON
   */
  static exportToJSON(entities: AppEntity[], includeMeta = true): string {
    const data = {
      ...(includeMeta && {
        exportTime: new Date().toISOString(),
        version: '1.0',
        totalCount: entities.length,
      }),
      apps: entities.map(entity => ({
        appName: entity.appName,
        appType: entity.appType,
        ip: entity.ip,
        domain: entity.domain,
        url: entity.url,
        status: entity.status,
        isBuiltIn: entity.isBuiltIn,
        confidence: entity.confidence,
        ...(includeMeta && {
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        }),
      })),
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出应用数据为CSV
   */
  static exportToCSV(entities: AppEntity[]): string {
    const headers = [
      'appName',
      'appType',
      'ip',
      'domain',
      'url',
      'status',
      'isBuiltIn',
      'confidence',
      'createdAt',
      'updatedAt',
    ];
    
    const csvContent = [
      headers.join(','),
      ...entities.map(entity => [
        `"${entity.appName}"`,
        `"${entity.appType}"`,
        `"${entity.ip || ''}"`,
        `"${entity.domain || ''}"`,
        `"${entity.url || ''}"`,
        `"${entity.status}"`,
        entity.isBuiltIn ? 'true' : 'false',
        entity.confidence?.toString() || '',
        entity.createdAt.toString(),
        entity.updatedAt.toString(),
      ].join(',')),
    ].join('\n');
    
    return csvContent;
  }

  /**
   * 从JSON导入应用数据
   */
  static importFromJSON(jsonString: string): {
    success: boolean;
    data?: AppCreatePayload[];
    error?: string;
    meta?: any;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      
      // 验证数据结构
      if (!parsed.apps || !Array.isArray(parsed.apps)) {
        return {
          success: false,
          error: '无效的JSON格式：缺少apps数组',
        };
      }
      
      const data: AppCreatePayload[] = parsed.apps.map((app: any) => ({
        appName: app.appName,
        appType: app.appType,
        ip: app.ip,
        domain: app.domain,
        url: app.url,
        status: app.status || 'active',
        isBuiltIn: app.isBuiltIn || false,
        confidence: app.confidence,
      }));
      
      return {
        success: true,
        data,
        meta: {
          importTime: new Date().toISOString(),
          originalExportTime: parsed.exportTime,
          totalCount: data.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 从CSV导入应用数据
   */
  static importFromCSV(csvString: string): {
    success: boolean;
    data?: AppCreatePayload[];
    error?: string;
    meta?: any;
  } {
    try {
      const lines = csvString.trim().split('\n');
      
      if (lines.length < 2) {
        return {
          success: false,
          error: 'CSV文件格式错误：至少需要标题行和一行数据',
        };
      }
      
      const headers = lines[0]?.split(',').map(h => h.replace(/"/g, '').trim()) || [];
      const requiredHeaders = ['appName', 'appType'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return {
          success: false,
          error: `CSV文件缺少必要列: ${missingHeaders.join(', ')}`,
        };
      }
      
      const data: AppCreatePayload[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue; // 跳过空行
        const values = line!.split(',').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || undefined;
        });
        
        data.push({
          appName: row.appName,
          appType: row.appType,
          ip: row.ip,
          domain: row.domain,
          url: row.url,
          status: row.status || 'active',
          isBuiltIn: row.isBuiltIn === 'true',
          confidence: row.confidence ? Number(row.confidence) : undefined,
        });
      }
      
      return {
        success: true,
        data,
        meta: {
          importTime: new Date().toISOString(),
          totalCount: data.length,
          processedLines: lines.length - 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

/**
 * 搜索适配器
 */
export class SearchAdapter {
  /**
   * 构建搜索查询参数
   */
  static buildSearchQuery(params: {
    query?: string;
    type?: 'name' | 'ip' | 'domain' | 'url' | 'category';
    categoryId?: string;
    isBuiltIn?: boolean;
    status?: 'active' | 'inactive';
  }) {
    const queryParams: any = {};
    
    if (params.query?.trim()) {
      queryParams.search = params.query.trim();
      queryParams.searchType = params.type || 'name';
    }
    
    if (params.categoryId) {
      queryParams.categoryId = params.categoryId;
    }
    
    if (params.isBuiltIn !== undefined) {
      queryParams.isBuiltIn = params.isBuiltIn;
    }
    
    if (params.status) {
      queryParams.status = params.status;
    }
    
    return queryParams;
  }

  /**
   * 高亮搜索结果
   */
  static highlightSearchResults(entities: AppEntity[], query: string, field: string): AppEntity[] {
    if (!query.trim()) return entities;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return entities.map(entity => {
      const highlightedEntity = { ...entity };
      
      if (field === 'name' && entity.appName) {
        (highlightedEntity as any).highlightedAppName = entity.appName.replace(
          regex,
          '<mark>$1</mark>'
        );
      }
      
      // 可以扩展其他字段的高亮
      
      return highlightedEntity;
    });
  }
}
