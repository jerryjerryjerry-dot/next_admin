"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "~/components/AuthGuard";
import { AdminLayout } from "~/components/ui/layout";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Key, 
  FileText, 
  Activity, 
  Server, 
  Plus, 
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Shield,
  AlertTriangle,
  Package,
  Globe
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

import { CreateApiKeyModal } from "~/components/openapi/CreateApiKeyModal";
import { ViewApiKeyModal } from "~/components/openapi/ViewApiKeyModal";
import { ApiTestModal } from "~/components/openapi/ApiTestModal";
import { RealTimeChart } from "~/components/openapi/RealTimeChart";
import { SystemMonitorDashboard } from "~/components/openapi/SystemMonitorCharts";
import { PandaTechChart } from "~/components/openapi/PandaTechChart";
import { PandaTechRadar } from "~/components/openapi/PandaTechRadar";
import { PandaTechRing } from "~/components/openapi/PandaTechRing";
import { PandaTechDashboard } from "~/components/openapi/PandaTechDashboard";
import { 
  type TabValue, 
  type ApiKeyTableRow, 
  type ApiCategoryWithEndpoints,
  type ApiCallTableRow,
  type ApiStatsResponse,
  type SystemStatusUI,
  type ApiEndpointDetail
} from "~/types/openapi";

// 密钥管理组件
const ApiKeyManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKeyTableRow | null>(null);

  // 获取API密钥列表
  const { data: apiKeys = [], isLoading, refetch } = api.openApi.keys.getAll.useQuery();

  // 删除密钥
  const deleteMutation = api.openApi.keys.delete.useMutation({
    onSuccess: () => {
      toast({ title: "密钥删除成功" });
      void refetch();
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    },
  });

  // 切换密钥状态
  const toggleStatusMutation = api.openApi.keys.toggleStatus.useMutation({
    onSuccess: () => {
      toast({ title: "状态更新成功" });
      void refetch();
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  // 批量操作
  const batchOperationMutation = api.openApi.keys.batchOperation.useMutation({
    onSuccess: () => {
      toast({ title: "批量操作成功" });
      setSelectedKeys([]);
      void refetch();
    },
    onError: (error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });

  const handleViewKey = (key: ApiKeyTableRow) => {
    setSelectedApiKey(key);
    setIsViewModalOpen(true);
  };



  const handleDeleteKey = (keyId: string) => {
    if (confirm("确定要删除这个API密钥吗？")) {
      deleteMutation.mutate(keyId);
    }
  };

  const handleToggleStatus = (keyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id: keyId, status: newStatus });
  };

  const handleCopyAccessKey = (accessKeyId: string) => {
    void navigator.clipboard.writeText(accessKeyId);
    toast({ title: "已复制到剪贴板" });
  };

  // 类型安全的数据转换
  const typedApiKeys: ApiKeyTableRow[] = Array.isArray(apiKeys) ? apiKeys : [];
  
  // 搜索过滤
  const filteredKeys = typedApiKeys.filter(key => {
    if (!key || typeof key !== 'object') return false;
    const keyName = key.keyName?.toLowerCase() ?? '';
    const purpose = key.purpose?.toLowerCase() ?? '';
    const accessKeyId = key.accessKeyId?.toLowerCase() ?? '';
    const searchLower = searchTerm.toLowerCase();
    
    return keyName.includes(searchLower) || 
           purpose.includes(searchLower) || 
           accessKeyId.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索密钥..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedKeys.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                已选择 {selectedKeys.length} 个密钥
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchOperationMutation.mutate({ ids: selectedKeys, operation: "activate" })}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                批量启用
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchOperationMutation.mutate({ ids: selectedKeys, operation: "deactivate" })}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                批量禁用
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`确定要删除选中的 ${selectedKeys.length} 个密钥吗？`)) {
                    batchOperationMutation.mutate({ ids: selectedKeys, operation: "delete" });
                  }
                }}
                className="bg-black text-white hover:bg-gray-800"
              >
                批量删除
              </Button>
            </>
          )}
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建密钥
          </Button>
        </div>
      </div>

      {/* API密钥列表 */}
      <Card>
        <CardHeader>
          <CardTitle>API密钥列表</CardTitle>
          <CardDescription>
            管理您的API访问密钥，用于调用系统接口
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "未找到匹配的密钥" : "暂无API密钥"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "请尝试其他搜索词" : "创建您的第一个API密钥来开始使用"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建密钥
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 桌面端表格视图 */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
                        <th className="pb-3 w-12">
                          <input
                            type="checkbox"
                            checked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedKeys(filteredKeys.map(k => k.id));
                              } else {
                                setSelectedKeys([]);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="pb-3">密钥名称</th>
                        <th className="pb-3">AccessKey ID</th>
                        <th className="pb-3">权限</th>
                        <th className="pb-3">配额使用</th>
                        <th className="pb-3">状态</th>
                        <th className="pb-3">最后使用</th>
                        <th className="pb-3 w-32">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredKeys.map((key) => (
                        <tr key={key.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <input
                              type="checkbox"
                              checked={selectedKeys.includes(key.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedKeys([...selectedKeys, key.id]);
                                } else {
                                  setSelectedKeys(selectedKeys.filter(id => id !== key.id));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="py-4">
                            <div>
                              <div className="font-medium text-gray-900">{key.keyName}</div>
                              <div className="text-sm text-gray-500">{key.purpose}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {key.accessKeyId}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyAccessKey(key.accessKeyId)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {key.permissionLabels?.slice(0, 2).map((perm, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              )) ?? []}
                              {(key.permissionLabels?.length ?? 0) > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(key.permissionLabels?.length ?? 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            {key.quotaLimit ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {key.quotaUsed} / {key.quotaLimit}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(key.quotaUsagePercent, 100)}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500">
                                  {key.quotaUsagePercent}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">无限制</span>
                            )}
                          </td>
                          <td className="py-4">
                            <Badge variant={
                              key.isExpired ? "destructive" :
                              key.status === "active" ? "default" : "secondary"
                            }>
                              {key.isExpired ? "已过期" :
                               key.status === "active" ? "启用" : "禁用"}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-gray-500">
                              {key.lastUsedAt 
                                ? new Date(key.lastUsedAt).toLocaleDateString('zh-CN')
                                : "从未使用"
                              }
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewKey(key)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* 密钥不可编辑，移除编辑按钮 */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(key.id, key.status)}
                                disabled={key.isExpired}
                              >
                                {key.status === "active" ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKey(key.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 移动端卡片视图 */}
              <div className="md:hidden space-y-4">
                {filteredKeys.map((key) => (
                  <Card key={key.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{key.keyName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{key.purpose}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(key.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKeys([...selectedKeys, key.id]);
                            } else {
                              setSelectedKeys(selectedKeys.filter(id => id !== key.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">AccessKey ID</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {key.accessKeyId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAccessKey(key.accessKeyId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">状态</span>
                        <Badge variant={
                          key.isExpired ? "destructive" :
                          key.status === "active" ? "default" : "secondary"
                        }>
                          {key.isExpired ? "已过期" :
                           key.status === "active" ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      
                      {key.quotaLimit && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">配额使用</span>
                            <span className="text-sm">{key.quotaUsed} / {key.quotaLimit}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(key.quotaUsagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {key.permissionLabels?.slice(0, 3).map((perm, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        )) ?? []}
                        {(key.permissionLabels?.length ?? 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(key.permissionLabels?.length ?? 0) - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewKey(key)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* 密钥不可编辑，移除编辑按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(key.id, key.status)}
                          disabled={key.isExpired}
                        >
                          {key.status === "active" ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模态框 */}
      <CreateApiKeyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          void refetch();
          setIsCreateModalOpen(false);
        }}
      />



      <ViewApiKeyModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        apiKey={selectedApiKey}
      />
    </div>
  );
};

// 接口文档组件
const ApiDocumentation = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");

  // 获取API分类
  const { data: categories = [], isLoading } = api.openApi.categories.getAll.useQuery();

  // 类型安全的数据转换
  const typedCategories: ApiCategoryWithEndpoints[] = Array.isArray(categories) ? categories : [];

  // 获取选中分类的详细信息
  const { data: categoryDetail } = api.openApi.categories.getById.useQuery(
    selectedCategory,
    { enabled: !!selectedCategory }
  );

  // 获取选中端点的详细信息
  const { data: endpointDetail } = api.openApi.endpoints.getById.useQuery(
    selectedEndpoint,
    { enabled: !!selectedEndpoint }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 分类列表 */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              API分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5) as undefined[]].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {typedCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedEndpoint("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.displayName}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.endpoints?.length ?? 0}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 端点列表 */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>API端点</CardTitle>
            <CardDescription>
              {selectedCategory ? "选择一个端点查看详细信息" : "请先选择一个分类"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCategory ? (
              categoryDetail?.endpoints ? (
                <div className="space-y-3">
                  {categoryDetail.endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        selectedEndpoint === endpoint.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{endpoint.name}</span>
                        <Badge 
                          variant={endpoint.method === "GET" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {endpoint.method}
                        </Badge>
                      </div>
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>该分类下暂无端点</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>请先选择一个API分类</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 端点详情 */}
      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle>端点详情</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEndpoint && endpointDetail ? (
              <ApiEndpointDetails endpoint={endpointDetail} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>请选择一个端点查看详细信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// API端点详情组件
const ApiEndpointDetails = ({ endpoint }: { endpoint: ApiEndpointDetail }) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{endpoint.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant={endpoint.method === "GET" ? "default" : "secondary"}>
              {endpoint.method}
            </Badge>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {endpoint.endpoint}
            </code>
          </div>
          <p className="text-gray-600">{endpoint.description}</p>
        </div>
      </div>

      {/* 请求参数 */}
      <div>
        <h4 className="font-medium mb-2">请求参数</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <pre className="text-sm overflow-x-auto">
            {endpoint.requestSchema ? 
              JSON.stringify(JSON.parse(endpoint.requestSchema), null, 2) : 
              "无请求参数"
            }
          </pre>
        </div>
      </div>

      {/* 响应格式 */}
      <div>
        <h4 className="font-medium mb-2">响应格式</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <pre className="text-sm overflow-x-auto">
            {endpoint.responseSchema ? 
              JSON.stringify(JSON.parse(endpoint.responseSchema), null, 2) : 
              "无响应格式定义"
            }
          </pre>
        </div>
      </div>

      {/* 其他信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">认证要求</h4>
          <Badge variant={endpoint.requireAuth ? "destructive" : "default"}>
            {endpoint.requireAuth ? "需要认证" : "无需认证"}
          </Badge>
        </div>
        {endpoint.rateLimit && (
          <div>
            <h4 className="font-medium mb-2">速率限制</h4>
            <span className="text-sm text-gray-600">
              {endpoint.rateLimit} 次/分钟
            </span>
          </div>
        )}
      </div>

      {endpoint.deprecated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm font-medium">
              此端点已弃用，建议使用新版本
            </span>
          </div>
        </div>
      )}

      {/* API测试按钮 */}
      <div className="pt-4 border-t border-gray-200">
        <Button 
          onClick={() => setIsTestModalOpen(true)}
          className="w-full"
          disabled={endpoint.deprecated || endpoint.status !== 'active'}
        >
          <Activity className="h-4 w-4 mr-2" />
          测试此API
        </Button>
      </div>

      {/* API测试模态框 */}
      <ApiTestModal 
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        endpoint={endpoint}
      />
    </div>
  );
};

// 调用监控组件
const ApiMonitoring = () => {
  const [timeRange, setTimeRange] = useState("24h");
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [chartData, setChartData] = useState<Array<{
    timestamp: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    responseTime: number;
  }>>([]);

  
  // 获取统计数据 - 使用react-query的自动刷新
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = api.openApi.monitoring.getStats.useQuery({
    timeRange: timeRange as "1h" | "24h" | "7d" | "30d",
  }, {
    refetchInterval: isRealTimeEnabled ? 3000 : false, // 3秒刷新
    refetchIntervalInBackground: true,
  });

  // 获取调用日志 - 自动刷新
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = api.openApi.monitoring.getCalls.useQuery({
    limit: 20,
    offset: 0,
    timeRange: timeRange as "1h" | "24h" | "7d" | "30d",
  }, {
    refetchInterval: isRealTimeEnabled ? 5000 : false, // 5秒刷新
    refetchIntervalInBackground: true,
  });

  // 手动刷新机制
  const handleManualRefresh = () => {
    void refetchStats();
    void refetchLogs();
  };

  // 启动/停止实时监控
  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  // 更新图表数据
  useEffect(() => {
    if (stats && isRealTimeEnabled) {
      const newDataPoint = {
        timestamp: Date.now(),
        totalCalls: stats.totalCalls ?? 0,
        successfulCalls: stats.successfulCalls ?? 0,
        failedCalls: stats.failedCalls ?? 0,
        responseTime: stats.avgResponseTime ?? 0,
      };

      setChartData(prevData => {
        const updatedData = [...prevData, newDataPoint];
        // 保持最近50个数据点
        if (updatedData.length > 50) {
          return updatedData.slice(-50);
        }
        return updatedData;
      });
    }
  }, [stats, isRealTimeEnabled]);

  // 初始化图表数据
  useEffect(() => {
    if (chartData.length === 0) {
      // 生成初始模拟数据
      const initialData = [];
      const now = Date.now();
      for (let i = 20; i >= 0; i--) {
        const baseValue = 1000 + Math.random() * 500;
        initialData.push({
          timestamp: now - i * 10000, // 每10秒一个点
          totalCalls: Math.floor(baseValue),
          successfulCalls: Math.floor(baseValue * 0.85),
          failedCalls: Math.floor(baseValue * 0.15),
          responseTime: Math.floor(50 + Math.random() * 100),
        });
      }
      setChartData(initialData);
    }
  }, [chartData.length]);

  // 类型安全的数据转换
  const typedStats: ApiStatsResponse = stats ? {
    totalCalls: stats.totalCalls ?? 0,
    successfulCalls: stats.successfulCalls ?? 0,
    failedCalls: stats.failedCalls ?? 0,
    successRate: stats.successRate ?? 0,
    avgResponseTime: stats.avgResponseTime ?? 0,
    topEndpoints: stats.topEndpoints?.map((item: { endpointId: string; name?: string; calls: number }) => ({
      endpointId: item.endpointId ?? '',
      name: item.name,
      calls: item.calls ?? 0,
    })) ?? [],
    callsOverTime: stats.callsOverTime?.map((item: { createdAt: Date; count: number }) => ({
      createdAt: item.createdAt ?? new Date(),
      count: item.count ?? 0,
    })) ?? [],
  } : {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    topEndpoints: [],
    callsOverTime: [],
  };

  const typedLogs: ApiCallTableRow[] = Array.isArray(logsData?.calls) ? logsData.calls : [];

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">实时监控</h2>
        <div className="flex items-center gap-4">
          {/* 实时开关 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isRealTimeEnabled ? '实时监控' : '已暂停'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
              className="ml-2"
            >
              {isRealTimeEnabled ? '暂停' : '启动'}
            </Button>
          </div>
          
          {/* 手动刷新 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={statsLoading || logsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(statsLoading || logsLoading) ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          {/* 时间范围选择 */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1小时</SelectItem>
              <SelectItem value="24h">24小时</SelectItem>
              <SelectItem value="7d">7天</SelectItem>
              <SelectItem value="30d">30天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总调用次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : typedStats.totalCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : `${typedStats.successRate.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均响应时间</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : `${typedStats.avgResponseTime}ms`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">失败次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : typedStats.failedCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 熊猫科技风格实时监控图表 */}
      <PandaTechChart
        title="🐼 API调用实时监控"
        data={chartData}
        width={1000}
        height={350}
        className="col-span-full"
      />

      {/* 调用日志 */}
      <Card>
        <CardHeader>
          <CardTitle>最近调用日志</CardTitle>
          <CardDescription>
            显示最近的API调用记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : typedLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无调用记录</h3>
              <p className="text-gray-500">该时间段内没有API调用记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
                    <th className="pb-3">时间</th>
                    <th className="pb-3">端点</th>
                    <th className="pb-3">方法</th>
                    <th className="pb-3">状态码</th>
                    <th className="pb-3">响应时间</th>
                    <th className="pb-3">API密钥</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {typedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {log.endpoint}
                        </code>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={
                          log.statusCode >= 200 && log.statusCode < 300 ? "default" :
                          log.statusCode >= 400 ? "destructive" : "secondary"
                        }>
                          {log.statusCode}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">
                        {log.responseTime ? `${log.responseTime}ms` : "-"}
                      </td>
                      <td className="py-3 text-sm">
                        {log.apiKey?.keyName ?? "未知"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// 系统状态组件
const SystemStatus = () => {
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  const [resourceHistory, setResourceHistory] = useState<Array<{
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }>>([]);
  
  // 获取系统状态 - 实时更新
  const { data: systemStatus, isLoading, refetch } = api.openApi.stats.getSystemStatus.useQuery(undefined, {
    refetchInterval: isLiveMonitoring ? 2000 : false, // 2秒刷新
    refetchIntervalInBackground: true,
  });

  // 更新资源历史数据
  useEffect(() => {
    if (systemStatus && isLiveMonitoring) {
      const newDataPoint = {
        timestamp: Date.now(),
        cpu: Math.random() * 100, // 模拟CPU使用
        memory: Math.random() * 80 + 10, // 模拟内存使用  
        disk: Math.random() * 80 + 10, // 模拟磁盘使用
        network: Math.random() * 90 + 5, // 模拟网络使用
      };

      setResourceHistory(prevData => {
        const updatedData = [...prevData, newDataPoint];
        // 保持最近30个数据点
        if (updatedData.length > 30) {
          return updatedData.slice(-30);
        }
        return updatedData;
      });
    }
  }, [systemStatus, isLiveMonitoring]);

  // 初始化资源历史数据
  useEffect(() => {
    if (resourceHistory.length === 0) {
      const initialData = [];
      const now = Date.now();
      for (let i = 30; i >= 0; i--) {
        initialData.push({
          timestamp: now - i * 5000, // 每5秒一个点
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 70 + 15,
          disk: Math.random() * 60 + 20,
          network: Math.random() * 90 + 5,
        });
      }
      setResourceHistory(initialData);
    }
  }, [resourceHistory.length]);

  // 类型安全的数据转换
  const typedSystemStatus: SystemStatusUI = systemStatus ?? {} as SystemStatusUI;

  const modules = typedSystemStatus?.modules ?? [];

  // 生成模块性能数据
  const moduleData = modules.map((module) => ({
    name: module.moduleName ?? '未知模块',
    cpuUsage: module.cpuUsage ?? Math.random() * 100,
    memoryUsage: module.memoryUsage ?? Math.random() * 100,
    connections: module.connections ?? Math.floor(Math.random() * 100),
    status: module.status === 'healthy' || module.status === 'warning' || module.status === 'error' 
             ? module.status 
             : 'healthy',
    timestamp: Date.now(),
  }));

  // 如果没有模块数据，生成模拟数据
  const finalModuleData = moduleData.length > 0 ? moduleData : [
    { name: 'SDK API', cpuUsage: 37, memoryUsage: 40, connections: 158, status: 'healthy' as const, timestamp: Date.now() },
    { name: '应用识别', cpuUsage: 63, memoryUsage: 63, connections: 91, status: 'healthy' as const, timestamp: Date.now() },
    { name: '跨境识别', cpuUsage: 86, memoryUsage: 77, connections: 60, status: 'warning' as const, timestamp: Date.now() },
    { name: '定制化能力', cpuUsage: 51, memoryUsage: 49, connections: 43, status: 'healthy' as const, timestamp: Date.now() },
    { name: '周边接口', cpuUsage: 31, memoryUsage: 34, connections: 36, status: 'healthy' as const, timestamp: Date.now() },
  ];

  // 连接状态数据
  const totalConns = 388; // 模拟总连接数
  const connectionData = {
    totalConnections: totalConns,
    activeConnections: Math.floor(totalConns * 0.7),
    errorConnections: Math.floor(totalConns * 0.1),
  };

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">系统状态监控</h2>
        <div className="flex items-center gap-4">
          {/* 实时监控状态 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLiveMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isLiveMonitoring ? '实时监控' : '已暂停'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className="ml-2"
            >
              {isLiveMonitoring ? '暂停' : '启动'}
            </Button>
          </div>
          
          {/* 手动刷新 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 系统概览 - 重新设计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">系统状态</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <p className="text-xl font-bold text-green-600">正常运行</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">系统负载</p>
                <p className="text-xl font-bold text-gray-900">42%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div className="bg-blue-600 h-1 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 opacity-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">活跃连接</p>
                <p className="text-xl font-bold text-gray-900">393</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">↑ 12% vs 昨天</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">运行时间</p>
                <p className="text-xl font-bold text-gray-900">157天</p>
                <p className="text-xs text-orange-600 mt-1 font-medium">稳定运行</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 熊猫科技风格监控面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PandaTechRadar
          data={finalModuleData}
          width={450}
          height={450}
        />
        
        <PandaTechRing
          totalConnections={connectionData.totalConnections}
          activeConnections={connectionData.activeConnections}
          errorConnections={connectionData.errorConnections}
          width={450}
          height={450}
        />
      </div>

      {/* 模块状态详情 */}
      <Card>
        <CardHeader>
          <CardTitle>模块状态详情</CardTitle>
          <CardDescription>
            各系统模块的详细运行状态和资源使用情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5) as undefined[]].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无模块数据</h3>
              <p className="text-gray-500">系统模块状态数据暂不可用</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{module.moduleName}</h3>
                      <Badge variant={
                        module.status === "healthy" ? "default" :
                        module.status === "warning" ? "secondary" : "destructive"
                      }>
                        {module.status === "healthy" ? "正常" :
                         module.status === "warning" ? "警告" : "错误"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      连接数: {module.connections}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">CPU使用率</span>
                        <span className="text-sm font-medium">{module.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            module.cpuUsage > 80 ? "bg-red-500" :
                            module.cpuUsage > 60 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${module.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">内存使用率</span>
                        <span className="text-sm font-medium">{module.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            module.memoryUsage > 80 ? "bg-red-500" :
                            module.memoryUsage > 60 ? "bg-yellow-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${module.memoryUsage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 容灾状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>容灾状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">当前节点</span>
                <span className="text-sm text-gray-900">
                  {typedSystemStatus?.disasterRecovery?.currentNode ?? "未知"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">备用节点</span>
                <span className="text-sm text-gray-900">
                  {typedSystemStatus?.disasterRecovery?.standbyNodes?.length ?? 0} 个节点
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">最后切换</span>
                <span className="text-sm text-gray-900">
                  {typedSystemStatus?.disasterRecovery?.lastSwitchTime ?? "从未切换"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>外部连接</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typedSystemStatus?.externalConnections?.map((conn, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{conn.name}</div>
                    <div className="text-sm text-gray-500">{conn.systemId}</div>
                  </div>
                  <Badge variant={conn.status === "connected" ? "default" : "destructive"}>
                    {conn.status === "connected" ? "已连接" : "断开"}
                  </Badge>
                </div>
              )) ?? (
                <div className="text-center py-4 text-gray-500">
                  暂无外部连接数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// OpenAPI管理中心内容组件
const OpenAPIContent = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("keys");

  return (
    <div className="space-y-6">

      {/* 主内容 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        {/* Tab导航 */}
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger 
            value="keys" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-100"
          >
            <Key className="h-4 w-4" />
            <span className="font-medium">密钥管理</span>
          </TabsTrigger>
          <TabsTrigger 
            value="docs" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-100"
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">接口文档</span>
          </TabsTrigger>
          <TabsTrigger 
            value="monitor" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-100"
          >
            <Activity className="h-4 w-4" />
            <span className="font-medium">调用监控</span>
          </TabsTrigger>
          <TabsTrigger 
            value="system" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-100"
          >
            <Server className="h-4 w-4" />
            <span className="font-medium">系统状态</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab内容区域 */}
        <div className="mt-6">
          <TabsContent value="keys" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ErrorBoundary>
                <ApiKeyManagement />
              </ErrorBoundary>
            </div>
            </TabsContent>

          <TabsContent value="docs" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ErrorBoundary>
                <ApiDocumentation />
              </ErrorBoundary>
            </div>
            </TabsContent>

          <TabsContent value="monitor" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ErrorBoundary>
                <ApiMonitoring />
              </ErrorBoundary>
            </div>
            </TabsContent>

          <TabsContent value="system" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ErrorBoundary>
                <SystemStatus />
              </ErrorBoundary>
            </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default function OpenAPIPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <OpenAPIContent />
      </AdminLayout>
    </AuthGuard>
  );
}
