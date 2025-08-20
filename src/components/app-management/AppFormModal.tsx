"use client";

import { useState, useEffect } from "react";
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
import type { AppEntry, AppFormData } from "~/types/api-response";
import { validateAppForm } from "~/lib/validators";

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppFormData) => void;
  editingApp?: AppEntry | null;
  loading?: boolean;
}

type FormData = {
  appName: string;
  appType: string;
  ip?: string;
  domain?: string;
  url?: string;
  status: "active" | "inactive";
};

export function AppFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingApp,
  loading = false
}: AppFormModalProps) {
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<FormData>({
    defaultValues: {
      appName: "",
      appType: "",
      ip: "",
      domain: "",
      url: "",
      status: "active",
    },
  });

  // Mock 分类数据 (fallback)
  const mockCategories = [
    { id: "system-tools", name: "系统工具" },
    { id: "network-tools", name: "网络工具" },
    { id: "dev-tools", name: "开发工具" },
    { id: "db-tools", name: "数据库工具" },
    { id: "monitor-tools", name: "监控工具" },
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
        // 只添加叶子节点（isLeaf: true）作为可选项
        if (item.isLeaf) {
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

  const categories = categoriesData ? flattenCategories(categoriesData as CategoryNode[]) : mockCategories;

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
      });
    } else {
      form.reset({
        appName: "",
        appType: "",
        ip: "",
        domain: "",
        url: "",
        status: "active",
      });
    }
    setValidationErrors({});
  }, [editingApp, form]);

  const handleSubmit = (data: FormData) => {
    // 客户端验证
    const validation = validateAppForm(data);
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
    onSubmit(data);
  };

  const watchedValues = form.watch();
  const hasNetworkInfo = !!(watchedValues.ip ?? watchedValues.domain ?? watchedValues.url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                          应用的完整访问地址
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

