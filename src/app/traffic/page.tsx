"use client";

import { useState } from "react";
// import { RequireAnyRole } from "~/components/RequireRole"; // 移除权限检查
import { Plus, Search, Filter, RefreshCw, Trash2, Play } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { StatsGrid } from "~/components/traffic/StatsGrid";
import { TrafficTable } from "~/components/traffic/TrafficTable";
import { RuleFormModal } from "~/components/traffic/RuleFormModal";
import { DyeResultModal } from "~/components/traffic/DyeResultModal";
import { TraceModal } from "~/components/traffic/TraceModal";
import { ReportModal } from "~/components/traffic/ReportModal";
import { api } from "~/trpc/react";
import { convertDBRulesToTrafficRules, handlePromise } from "~/utils/traffic-converters";
import { useToast } from "~/hooks/use-toast";
import { getErrorMessage } from "~/types/error";
import type { 
  TrafficRule, 
  TrafficQueryParams, 
  TrafficRuleFormData,
  DyeResult 
} from "~/types/traffic";

export default function TrafficManagement() {
  // 查询参数状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [appTypeFilter, setAppTypeFilter] = useState<string>("");

  // 选择状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 弹窗状态
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TrafficRule | null>(null);
  const [dyeResultModalOpen, setDyeResultModalOpen] = useState(false);
  const [dyeResult, setDyeResult] = useState<DyeResult | null>(null);
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [traceRuleId, setTraceRuleId] = useState<string>("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportRuleId, setReportRuleId] = useState<string>("");

  // Toast通知
  const { toast } = useToast();

  // API调用
  const utils = api.useUtils();
  
  // 构建查询参数
  const queryParams: TrafficQueryParams = {
    page,
    pageSize,
    keyword: keyword || undefined,
    status: statusFilter ? (statusFilter as TrafficQueryParams['status']) : undefined,
    appType: appTypeFilter ? (appTypeFilter as TrafficQueryParams['appType']) : undefined
  };

  const { data: rulesData, isLoading: rulesLoading, refetch } = api.traffic.getList.useQuery(queryParams);

  // 转换数据格式以匹配TrafficRule类型
  const transformedRules: TrafficRule[] = rulesData?.data 
    ? convertDBRulesToTrafficRules(rulesData.data) 
    : [];

  const createMutation = api.traffic.create.useMutation({
    onSuccess: () => {
      setFormModalOpen(false);
      setEditingRule(null);
      handlePromise(utils.traffic.getList.invalidate());
      handlePromise(utils.traffic.getStats.invalidate());
      toast({ title: "规则创建成功" });
    },
    onError: (error) => {
      toast({ 
        title: "创建失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const updateMutation = api.traffic.update.useMutation({
    onSuccess: () => {
      setFormModalOpen(false);
      setEditingRule(null);
      handlePromise(utils.traffic.getList.invalidate());
      handlePromise(utils.traffic.getStats.invalidate());
      toast({ title: "规则更新成功" });
    },
    onError: (error) => {
      toast({ 
        title: "更新失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = api.traffic.delete.useMutation({
    onSuccess: () => {
      setSelectedIds([]);
      handlePromise(utils.traffic.getList.invalidate());
      handlePromise(utils.traffic.getStats.invalidate());
      toast({ title: "规则删除成功" });
    },
    onError: (error) => {
      toast({ 
        title: "删除失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const batchDeleteMutation = api.traffic.batchDelete.useMutation({
    onSuccess: () => {
      setSelectedIds([]);
      handlePromise(utils.traffic.getList.invalidate());
      handlePromise(utils.traffic.getStats.invalidate());
      toast({ title: "批量删除成功" });
    },
    onError: (error) => {
      toast({ 
        title: "批量删除失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const executeDyeMutation = api.traffic.executeDye.useMutation({
    onSuccess: (result) => {
      setDyeResult(result.data);
      setDyeResultModalOpen(true);
      handlePromise(utils.traffic.getList.invalidate());
      toast({ title: "染色执行成功" });
    },
    onError: (error) => {
      toast({ 
        title: "染色执行失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const batchDyeMutation = api.traffic.batchDye.useMutation({
    onSuccess: (result) => {
      // 对于批量染色，我们显示第一个结果或创建一个汇总结果
      const firstResult = result.data.results[0];
      if (firstResult && firstResult.success && firstResult.data) {
        // 提取DyeResult部分
        const dyeResultData: DyeResult = {
          dyeId: firstResult.data.dyeId,
          status: firstResult.data.status,
          startTime: firstResult.data.startTime,
          endTime: firstResult.data.endTime,
          affectedRequests: firstResult.data.affectedRequests,
          dyeRate: firstResult.data.dyeRate,
          message: firstResult.data.message,
        };
        setDyeResult(dyeResultData);
        setDyeResultModalOpen(true);
      }
      setSelectedIds([]);
      handlePromise(utils.traffic.getList.invalidate());
      toast({ title: "批量染色成功" });
    },
    onError: (error) => {
      toast({ 
        title: "批量染色失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  // 事件处理函数
  const handleCreateRule = () => {
    setEditingRule(null);
    setFormModalOpen(true);
  };

  const handleEditRule = (rule: TrafficRule) => {
    setEditingRule(rule);
    setFormModalOpen(true);
  };

  const handleFormSubmit = (data: TrafficRuleFormData) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('确定要删除这个规则吗？')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个规则吗？`)) {
      batchDeleteMutation.mutate({ ids: selectedIds });
    }
  };

  const handleDyeRule = (id: string) => {
    executeDyeMutation.mutate({ id });
  };

  const handleBatchDye = () => {
    if (selectedIds.length === 0) return;
    batchDyeMutation.mutate({ ids: selectedIds });
  };

  const handleTraceRule = (id: string) => {
    setTraceRuleId(id);
    setTraceModalOpen(true);
  };

  const handleReportRule = (id: string) => {
    setReportRuleId(id);
    setReportModalOpen(true);
  };

  const handleSearch = () => {
    setPage(1);
    void refetch();
  };

  const handleReset = () => {
    setKeyword("");
    setStatusFilter("");
    setAppTypeFilter("");
    setPage(1);
    void refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">流量染色管理</h1>
              <p className="mt-2 text-gray-600">
                管理和监控网络流量染色规则，实现精准的流量追踪分析
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={rulesLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${rulesLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button onClick={handleCreateRule} className="bg-gray-900 text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                新建规则
              </Button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8">
          <StatsGrid />
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg border mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索区域 */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="搜索规则名称..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-64"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch} disabled={rulesLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  搜索
                </Button>
              </div>
            </div>

            {/* 筛选区域 */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                </SelectContent>
              </Select>

              <Select value={appTypeFilter} onValueChange={setAppTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="应用类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleReset}>
                <Filter className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedIds.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  已选择 {selectedIds.length} 项
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDye}
                    disabled={batchDyeMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    批量染色
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={batchDeleteMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    批量删除
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 数据表格 */}
        <TrafficTable
          data={transformedRules}
          selectedIds={selectedIds}
          onSelectedChange={setSelectedIds}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onDye={handleDyeRule}
          onTrace={handleTraceRule}
          onReport={handleReportRule}
          loading={rulesLoading}
        />

        {/* 分页 */}
        {rulesData && rulesData.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              显示第 {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, rulesData.total)} 条，
              共 {rulesData.total} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <span className="text-sm">
                第 {page} 页，共 {rulesData.totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(rulesData.totalPages, p + 1))}
                disabled={page >= rulesData.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗组件 */}
      <RuleFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingRule={editingRule}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <DyeResultModal
        open={dyeResultModalOpen}
        onClose={() => setDyeResultModalOpen(false)}
        result={dyeResult}
      />

      <TraceModal
        open={traceModalOpen}
        onClose={() => setTraceModalOpen(false)}
        ruleId={traceRuleId}
        ruleName={transformedRules.find(r => r.id === traceRuleId)?.name}
      />

      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        ruleId={reportRuleId}
        ruleName={transformedRules.find(r => r.id === reportRuleId)?.name ?? ""}
      />
    </div>
  );
}
