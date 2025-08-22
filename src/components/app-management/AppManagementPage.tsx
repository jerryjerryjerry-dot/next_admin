"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { CreateButton } from "~/components/ui/operation-buttons";
import { CategoryTree } from "./CategoryTree";
import { SearchPanel } from "./SearchPanel";
import { AppTable } from "./AppTable";
import { AppFormModal } from "./AppFormModal";
import { AILearningPanel } from "./AILearningPanel";
import { AppDetailModal } from "./AppDetailModal";
import { ImportExportDialog } from "./ImportExportDialog";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/utils/api";
import type { AppEntry, SearchParams} from "~/types/api-response";
import type { AppFormData } from "~/types/app-management/base";
import { safeConvertToAppEntry } from "~/utils/data-converters";


type TabType = "builtin" | "custom";

export function AppManagementPage() {
  const { toast } = useToast();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<TabType>("builtin");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | null>(null);
  const [viewingApp, setViewingApp] = useState<AppEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");

  // API查询
  const { 
    data: appsResponse, 
    isLoading: appsLoading, 
    refetch: refetchApps 
  } = api.appManagement.apps.getAll.useQuery({
    categoryId: selectedCategoryId === "all" ? undefined : selectedCategoryId,
    isBuiltIn: activeTab === "builtin" ? true : false,
    page: currentPage,
    pageSize: pageSize,
    search: searchKeyword.trim() || undefined,
  });

  // 从响应中提取数据
  const apps = appsResponse?.data ?? [];
  const totalPages = appsResponse?.totalPages ?? 0;
  const total = appsResponse?.total ?? 0;

  // 添加调试信息
  useEffect(() => {
    if (appsResponse) {
      console.log('API返回数据:', {
        categoryId: selectedCategoryId,
        isBuiltIn: activeTab === "builtin" ? true : false,
        page: currentPage,
        dataCount: apps?.length || 0,
        total: total,
        totalPages: totalPages,
        data: apps?.slice(0, 3) // 只显示前3条用于调试
      });
    }
  }, [appsResponse, selectedCategoryId, activeTab, currentPage, apps, total, totalPages]);

  // 当搜索、分类、标签页变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, activeTab, searchKeyword]);

  // 移除旧的搜索查询逻辑，现在搜索集成到主查询中

  // API变更操作
  const createAppMutation = api.appManagement.apps.create.useMutation({
    onSuccess: () => {
      toast({ title: "应用创建成功" });
      setIsFormModalOpen(false);
      setEditingApp(null);
      void refetchApps();
    },
    onError: (error: { message: string }) => {
      let errorMessage = error.message;
      
      // 特殊处理URL验证错误
      if (error.message.includes("Invalid url")) {
        errorMessage = "URL格式无效，请确保包含完整的协议（如 https://）";
      }
      
      toast({ 
        title: "创建失败", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const updateAppMutation = api.appManagement.apps.update.useMutation({
    onSuccess: () => {
      toast({ title: "应用更新成功" });
      setIsFormModalOpen(false);
      setEditingApp(null);
      void refetchApps();
    },
    onError: (error: { message: string }) => {
      toast({ 
        title: "更新失败", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteAppMutation = api.appManagement.apps.delete.useMutation({
    onSuccess: () => {
      toast({ title: "应用删除成功" });
      void refetchApps();
    },
    onError: (error: { message: string }) => {
      toast({ 
        title: "删除失败", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const batchDeleteMutation = api.appManagement.apps.batchDelete.useMutation({
    onSuccess: () => {
      toast({ title: "批量删除成功" });
      void refetchApps();
    },
    onError: (error: { message: string }) => {
      toast({ 
        title: "批量删除失败", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const batchCreateMutation = api.appManagement.apps.batchCreate.useMutation({
    onSuccess: (data: { successCount: number; skipCount: number; errorCount: number; errors: string[] }) => {
      const { successCount, skipCount, errorCount, errors } = data;
      const title = `导入完成`;
      let description = `成功导入 ${successCount} 个应用`;
      
      if (skipCount > 0) {
        description += `，跳过 ${skipCount} 个重复应用`;
      }
      
      if (errorCount > 0) {
        description += `，${errorCount} 个应用导入失败`;
        if (errors.length > 0) {
          description += `\n错误详情：${errors.slice(0, 3).join('; ')}`;
          if (errors.length > 3) {
            description += `...等${errors.length - 3}个错误`;
          }
        }
      }
      
      toast({ 
        title, 
        description,
        variant: errorCount > 0 ? "destructive" : "default"
      });
      void refetchApps();
      setIsImportDialogOpen(false);
    },
    onError: (error: { message: string }) => {
      toast({ 
        title: "导入失败", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // 事件处理函数

  const handleCreateApp = () => {
    setEditingApp(null);
    setIsFormModalOpen(true);
  };

  const handleEditApp = (app: AppEntry) => {
    setEditingApp(app);
    setIsFormModalOpen(true);
  };

  const handleViewApp = (app: AppEntry) => {
    setViewingApp(app);
    setIsDetailModalOpen(true);
  };

  const handleDeleteApp = (appId: string) => {
    if (confirm("确定要删除这个应用吗？")) {
      deleteAppMutation.mutate(appId);
    }
  };

  const handleBatchDelete = (appIds: string[]) => {
    if (confirm(`确定要删除选中的 ${appIds.length} 个应用吗？`)) {
      batchDeleteMutation.mutate(appIds);
    }
  };

  const handleBatchExport = (appIds: string[]) => {
    const convertedApps = safeConvertToAppEntry(apps);
    const selectedApps = convertedApps.filter(app => appIds.includes(app.id));
    handleExportApps(selectedApps);
  };

  const handleExportApps = (appsToExport: AppEntry[]) => {
    try {
      const data = {
        exportTime: new Date().toISOString(),
        totalCount: appsToExport.length,
        apps: appsToExport.map(app => ({
          appName: app.appName,
          appType: app.appType,
          categoryPath: app.categoryPath,
          ip: app.ip ?? '',
          domain: app.domain ?? '',
          url: app.url ?? '',
          status: app.status,
          isBuiltIn: app.isBuiltIn,
          confidence: app.confidence,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        }))
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `应用列表导出_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: `导出成功，共${appsToExport.length}个应用` });
    } catch {
      toast({ 
        title: "导出失败", 
        description: "请稍后重试",
        variant: "destructive" 
      });
    }
  };

  const handleFormSubmit = (data: AppFormData) => {
    console.log('📥 AppManagementPage收到表单数据:', data);
    
    if (editingApp) {
      const updateData = { id: editingApp.id, ...data };
      console.log('🔄 准备更新应用:', updateData);
      updateAppMutation.mutate(updateData);
    } else {
      console.log('🆕 准备创建应用:', data);
      createAppMutation.mutate(data);
    }
  };

  const handleSearch = (params: SearchParams) => {
    // 使用新的搜索逻辑
    setSearchKeyword(params.queryValue ?? "");
    setCurrentPage(1); // 搜索时重置到第一页
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setCurrentPage(1);
  };



  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = JSON.parse(content);
        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!data.apps || !Array.isArray(data.apps)) {
          throw new Error('文件格式不正确，必须包含apps数组');
        }
        
        // 验证应用数据格式
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const apps = data.apps as unknown[];
        const validApps = [];
        
        for (const app of apps) {
          if (typeof app !== 'object' || app === null) {
            continue;
          }
          
          const appData = app as Record<string, unknown>;
          
          // 基本字段验证
          if (typeof appData.appName !== 'string' || !appData.appName.trim()) {
            continue;
          }
          
          if (typeof appData.appType !== 'string' || !appData.appType.trim()) {
            continue;
          }
          
          // 至少要有一个网络字段
          const hasNetworkField = (
            (typeof appData.ip === 'string' && appData.ip.trim()) ||
            (typeof appData.domain === 'string' && appData.domain.trim()) ||
            (typeof appData.url === 'string' && appData.url.trim())
          );
          
          if (!hasNetworkField) {
            continue;
          }
          
          validApps.push({
            appName: String(appData.appName).trim(),
            appType: String(appData.appType).trim(),
            ip: typeof appData.ip === 'string' ? appData.ip.trim() || undefined : undefined,
            domain: typeof appData.domain === 'string' ? appData.domain.trim() || undefined : undefined,
            url: typeof appData.url === 'string' ? appData.url.trim() || undefined : undefined,
            status: (appData.status === 'active' || appData.status === 'inactive') ? appData.status : 'active' 
          });
        }
        
        if (validApps.length === 0) {
          throw new Error('文件中没有找到有效的应用数据');
        }
        
        // 调用批量创建API
        batchCreateMutation.mutate({ 
          apps: validApps as Array<{
            appType: string;
            appName: string;
            status?: "active" | "inactive";
            isBuiltIn?: boolean;
            ip?: string;
            domain?: string;
            url?: string;
            confidence?: number;
          }>
        });
        
      } catch (error) {
        toast({
          title: "文件解析失败",
          description: error instanceof Error ? error.message : "文件格式错误",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleExportAll = () => {
    try {
      // 使用当前显示的应用数据
      const exportData = {
        apps: apps.map(app => ({
          appName: app.appName,
          appType: app.appType,
          ip: app.ip,
          domain: app.domain,
          url: app.url,
          status: app.status,
        })),
        exportedAt: new Date().toISOString(),
        totalCount: apps.length,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `应用数据导出_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportDialogOpen(false);
      toast({
        title: "导出成功",
        description: `已导出 ${apps.length} 个应用数据`,
      });
    } catch {
      toast({
        title: "导出失败",
        description: "导出过程中发生错误",
        variant: "destructive",
      });
    }
  };

  // 显示的应用数据
  const displayApps = apps;
  const isLoading = appsLoading;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-6 py-6 space-y-8">
        {/* 页面标题和操作栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">应用管理</h1>
            <p className="text-sm text-gray-600 mt-1">管理内置应用和自定义应用配置</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <CreateButton
              onClick={handleCreateApp}
              loading={createAppMutation.isPending}
            />
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧分类树 */}
          <div className="col-span-12 lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <CategoryTree
                  selectedCategoryId={selectedCategoryId}
                  onCategorySelect={setSelectedCategoryId}
                />
              </div>
            </div>
          </div>

          {/* 右侧主要内容 */}
          <div className="col-span-12 lg:col-span-10 space-y-6">
            {/* 搜索面板 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <SearchPanel
                onSearch={handleSearch}
                onClear={handleClearSearch}
                loading={isLoading}
              />
            </div>

            {/* AI建议面板 */}
            <AILearningPanel currentTab={activeTab} />

            {/* 应用列表区域 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {/* 标签页导航 */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <TabsList className="grid w-full sm:w-64 grid-cols-2">
                      <TabsTrigger value="builtin" className="text-sm">内置应用</TabsTrigger>
                      <TabsTrigger value="custom" className="text-sm">自定义应用</TabsTrigger>
                    </TabsList>
                    
                    {/* 统计信息 */}
                    <div className="text-sm text-gray-500 text-center sm:text-right">
                      共 {total} 个应用
                    </div>
                  </div>
            
                  {/* 表格内容 */}
                  <TabsContent value="builtin" className="mt-0">
                    <AppTable
                      apps={displayApps}
                      loading={isLoading}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                      onBatchDelete={handleBatchDelete}
                      onBatchExport={handleBatchExport}
                      onView={handleViewApp}
                    />
                  </TabsContent>
                  
                  <TabsContent value="custom" className="mt-0">
                    <AppTable
                      apps={displayApps}
                      loading={isLoading}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                      onBatchDelete={handleBatchDelete}
                      onBatchExport={handleBatchExport}
                      onView={handleViewApp}
                    />
                  </TabsContent>
                </Tabs>

                {/* 分页区域 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      第 {currentPage} 页，共 {totalPages} 页 | 总计 {total} 条记录
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="border-gray-300"
                      >
                        上一页
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={isLoading}
                              className={currentPage === pageNum ? "bg-blue-600 text-white" : "border-gray-300"}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                        className="border-gray-300"
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>

      {/* 模态框 */}
      <AppFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingApp(null);
        }}
        onSubmit={handleFormSubmit}
        editingApp={editingApp}
        loading={createAppMutation.isPending || updateAppMutation.isPending}
      />

      <AppDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingApp(null);
        }}
        app={viewingApp}
      />

      <ImportExportDialog
        isImportOpen={isImportDialogOpen}
        isExportOpen={isExportDialogOpen}
        onImportClose={() => setIsImportDialogOpen(false)}
        onExportClose={() => setIsExportDialogOpen(false)}
        onImportFile={handleImportFile}
        onExportAll={handleExportAll}
        totalApps={apps.length}
      />
    </div>
  );
}

// 包装组件以添加错误边界
export function AppManagementPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AppManagementPage />
    </ErrorBoundary>
  );
}