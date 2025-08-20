"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { CreateButton, ImportExportButtons } from "~/components/ui/operation-buttons";
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
import type { AppEntry, SearchParams, AppFormData } from "~/types/api-response";
import { safeConvertToAppEntry } from "~/utils/data-converters";
import { 
  Layout, 
  RefreshCw
} from "lucide-react";

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
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  // API查询
  const { 
    data: apps = [], 
    isLoading: appsLoading, 
    refetch: refetchApps 
  } = api.appManagement.apps.getAll.useQuery({
    categoryId: selectedCategoryId === "all" ? undefined : selectedCategoryId,
    isBuiltIn: activeTab === "builtin" ? true : false,
  });

  // 搜索查询
  const { 
    data: searchResults = [], 
    isLoading: searchLoading,
  } = api.appManagement.apps.search.useQuery(
    searchParams!,
    { enabled: !!searchParams }
  );

  // API变更操作
  const createAppMutation = api.appManagement.apps.create.useMutation({
    onSuccess: () => {
      toast({ title: "应用创建成功" });
      setIsFormModalOpen(false);
      setEditingApp(null);
      void refetchApps();
    },
    onError: (error: { message: string }) => {
      toast({ 
        title: "创建失败", 
        description: error.message,
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
  const handleRefresh = () => {
    void refetchApps();
  };

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
    if (editingApp) {
      updateAppMutation.mutate({ id: editingApp.id, ...data });
    } else {
      createAppMutation.mutate(data);
    }
  };

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchParams(null);
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleExport = () => {
    setIsExportDialogOpen(true);
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
  const displayApps = searchParams ? searchResults : apps;
  const isLoading = searchParams ? searchLoading : appsLoading;

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <Layout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">应用管理</h1>
            <p className="text-gray-600">管理系统中的应用和服务</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
            loading={isLoading}
          />
          
          <CreateButton
            onClick={handleCreateApp}
            loading={createAppMutation.isPending}
          />
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧分类树 */}
        <div className="col-span-3">
          <CategoryTree
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>

        {/* 右侧主要内容 */}
        <div className="col-span-9 space-y-6">
          {/* 搜索面板 */}
          <SearchPanel
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={searchLoading}
          />

          {/* AI建议面板 */}
          {activeTab === "custom" && (
            <AILearningPanel />
          )}

          {/* 应用列表标签页 */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="builtin">内置应用</TabsTrigger>
              <TabsTrigger value="custom">自定义应用</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builtin" className="space-y-4">
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
            
            <TabsContent value="custom" className="space-y-4">
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