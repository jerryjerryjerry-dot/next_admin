"use client";

import React, { useState, useEffect } from "react";

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { api } from "~/utils/api";
import { useToast } from "~/hooks/use-toast";
import type { AppEntry } from "~/types/api-response";
import type { AppFormData } from "~/types/app-management/base";
import { validateAppForm } from "~/lib/validators";

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppFormData) => void;
  editingApp?: AppEntry | null;
  loading?: boolean;
}

// 使用统一的类型定义，已在顶部导入

export function AppFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingApp,
  loading = false
}: AppFormModalProps) {
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<AppFormData>({
    defaultValues: {
      appName: "",
      appType: "",
      categoryId: "",
      ip: "",
      domain: "",
      url: "",
      status: "active",
      isBuiltIn: false,
      confidence: undefined,
    },
  });

  // 默认的空分类列表 - 当API失败时显示
  const defaultCategories = [
    { id: "", name: "正在加载分类数据..." },
  ];

  // 获取分类数据
  const { 
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories 
  } = api.appManagement.categories.getTree.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // 调试日志
  React.useEffect(() => {
    if (categoriesData) {
      console.log('✅ AppFormModal API调用成功:', categoriesData);
    }
  }, [categoriesData]);

  // 定义分类节点类型
  interface CategoryNode {
    id: string;
    name: string;
    isLeaf: boolean;
    children?: CategoryNode[];
  }

  // 扁平化分类数据
  const flattenCategories = (categories: CategoryNode[]): Array<{id: string, name: string}> => {
    const result: Array<{id: string, name: string}> = [];
    
    const flatten = (items: CategoryNode[], prefix = "") => {
      items.forEach(item => {
        // 添加叶子节点或没有子节点的节点作为可选项
        if (item.isLeaf || !item.children || item.children.length === 0) {
          result.push({
            id: item.id,
            name: prefix + item.name
          });
        }
        
        // 如果有子节点，递归处理
        if (item.children && item.children.length > 0) {
          flatten(item.children, prefix + item.name + "/");
        }
      });
    };
    
    flatten(categories);
    return result;
  };

  const categories = categoriesData ? flattenCategories(categoriesData as CategoryNode[]) : defaultCategories;

  // 调试日志 - 查看表单下拉框的实际数据
  React.useEffect(() => {
    console.log('📋 AppFormModal下拉框选项:', {
      hasApiData: !!categoriesData,
      apiDataLength: categoriesData?.length ?? 0,
      finalCategories: categories,
    });
  }, [categoriesData, categories]);

  // 当编辑应用时，填充表单
  useEffect(() => {
    if (editingApp) {
      form.reset({
        appName: editingApp.appName,
        appType: editingApp.appType,
        ip: editingApp.ip ?? "",
        domain: editingApp.domain ?? "",
        url: editingApp.url ?? "",
        status: editingApp.status,
        isBuiltIn: editingApp.isBuiltIn ?? false,
        confidence: editingApp.confidence ?? undefined,
      });
    } else {
      form.reset({
        appName: "",
        appType: "",
        ip: "",
        domain: "",
        url: "",
        status: "active",
        isBuiltIn: false, // 默认值
        confidence: undefined, // 可选字段
      });
    }
    setValidationErrors({});
  }, [editingApp, form]);

  const handleSubmit = (data: AppFormData) => {
    console.log('🔍 AppFormModal原始表单数据:', data);
    console.log('🔍 数据类型检查:', {
      appName: typeof data.appName,
      appType: typeof data.appType,
      ip: typeof data.ip,
      domain: typeof data.domain,
      url: typeof data.url,
      status: typeof data.status,
      isBuiltIn: typeof data.isBuiltIn,
      confidence: typeof data.confidence,
    });
    
    // 检查是否有空字段
    const emptyFields = Object.entries(data).filter(([key, value]) => {
      if (key === 'confidence') return false; // confidence可以为undefined
      return value === undefined || value === null || value === '';
    });
    console.log('🔍 空字段检查:', emptyFields);
    
    // 预处理URL字段 - 自动添加协议
    const processedData = { ...data };
    if (processedData.url?.trim()) {
      const url = processedData.url.trim();
      // 如果URL没有协议，自动添加https://
      if (!/^https?:\/\//i.exec(url)) {
        processedData.url = `https://${url}`;
      }
    }

    console.log('🔧 AppFormModal处理后数据:', processedData);

    // 客户端验证
    const validation = validateAppForm(processedData);
    console.log('✅ AppFormModal验证结果:', validation);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "验证失败",
        description: "请检查表单中的错误信息",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    console.log('📤 AppFormModal即将提交数据:', processedData);
    console.log('📤 提交数据JSON:', JSON.stringify(processedData, null, 2));
    
    // 确保数据类型转换正确，清理空字符串
    const finalData: AppFormData = {
      appName: processedData.appName.trim(),
      appType: processedData.appType as string,
      categoryId: processedData.categoryId ?? "1", // 默认分类ID
      ip: processedData.ip?.trim() ?? undefined,
      domain: processedData.domain?.trim() ?? undefined,
      url: processedData.url?.trim() ?? undefined,
      status: processedData.status,
      isBuiltIn: processedData.isBuiltIn ?? false,
      confidence: processedData.confidence,
    };
    
    console.log('📤 最终提交数据:', finalData);
    onSubmit(finalData);
  };

  const watchedValues = form.watch();
  const hasNetworkInfo = !!(
    watchedValues.ip?.trim() ?? 
    watchedValues.domain?.trim() ?? 
    watchedValues.url?.trim()
  );
  
  // 调试网络信息检查
  console.log('🔍 网络信息检查:', {
    ip: watchedValues.ip,
    domain: watchedValues.domain,
    url: watchedValues.url,
    hasNetworkInfo,
    buttonDisabled: loading || !hasNetworkInfo
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {editingApp ? "编辑应用" : "新建应用"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">基本信息</h3>
                  
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>应用名称 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="输入应用名称"
                            {...field}
                          />
                        </FormControl>
                        {validationErrors.appName && (
                          <FormMessage>{validationErrors.appName}</FormMessage>
                        )}
                        <FormDescription>
                          应用的显示名称，支持中文、英文、数字等
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>应用分类 *</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl className="flex-1">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="选择应用分类" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => refetchCategories()}
                            disabled={categoriesLoading}
                          >
                            <RefreshCw className={`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        {validationErrors.appType && (
                          <FormMessage>{validationErrors.appType}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>应用状态</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">活跃</SelectItem>
                              <SelectItem value="inactive">非活跃</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 网络配置 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">网络配置</h3>
                    {!hasNetworkInfo && (
                      <Badge variant="destructive" className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        至少填写一项
                      </Badge>
                    )}
                  </div>
                  
                  <FormDescription>
                    至少需要填写 IP地址、域名、URL 中的一项
                  </FormDescription>

                  {validationErrors.network && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {validationErrors.network}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="ip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP地址</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: 192.168.1.100"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          支持 IPv4 和 IPv6 地址
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>域名</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: app.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          应用的访问域名
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>完整URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: https://app.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          应用的完整访问地址（自动添加https://前缀）
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 网络配置验证错误 */}
                {validationErrors.network && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{validationErrors.network}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 配置信息 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">配置信息</h3>
                  
                  <FormField
                    control={form.control}
                    name="isBuiltIn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            内置应用
                          </FormLabel>
                          <FormDescription>
                            将此应用标记为系统内置应用
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value ?? false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>置信度 (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="可选，0-100"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? undefined : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          应用识别的置信度，范围0-100
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading || !hasNetworkInfo}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingApp ? "更新" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

