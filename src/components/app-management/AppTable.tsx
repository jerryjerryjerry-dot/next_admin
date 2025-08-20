"use client";

import { useState, useEffect } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AppStatusBadge, BuiltInBadge, ConfidenceBadge } from "~/components/ui/app-status-badge";
import { RowActions, BatchActions } from "~/components/ui/operation-buttons";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  Database, 
  ExternalLink,
  Loader2
} from "lucide-react";
import type { AppEntry } from "~/types/api-response";

interface AppTableProps {
  apps: AppEntry[];
  loading?: boolean;
  onEdit: (app: AppEntry) => void;
  onDelete: (appId: string) => void;
  onBatchDelete: (appIds: string[]) => void;
  onBatchExport?: (appIds: string[]) => void;
  onView: (app: AppEntry) => void;
  className?: string;
}



export function AppTable({
  apps,
  loading = false,
  onEdit,
  onDelete,
  onBatchDelete,
  onBatchExport,
  onView,
  className
}: AppTableProps) {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  // 重置选择状态当应用列表改变时
  useEffect(() => {
    setSelectedApps([]);
  }, [apps]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApps(apps.map(app => app.id));
    } else {
      setSelectedApps([]);
    }
  };

  const handleSelectApp = (appId: string, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => [...prev, appId]);
    } else {
      setSelectedApps(prev => prev.filter(id => id !== appId));
    }
  };

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return '无效日期';
    }
  };

  const hasSelected = selectedApps.length > 0;
  const isAllSelected = selectedApps.length === apps.length && apps.length > 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>应用列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apps.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>应用列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无应用</h3>
            <p className="text-gray-500">当前分类下没有找到应用</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>应用列表 ({apps.length})</CardTitle>
          
          {hasSelected && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                已选择 {selectedApps.length} 项
              </span>
              {onBatchExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBatchExport(selectedApps)}
                >
                  批量导出
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBatchDelete(selectedApps)}
              >
                批量删除
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>应用名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>网络信息</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>置信度</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedApps.includes(app.id)}
                    onCheckedChange={(checked) => handleSelectApp(app.id, checked as boolean)}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {app.appName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{app.appName}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <BuiltInBadge isBuiltIn={app.isBuiltIn} />
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div className="text-gray-900">{app.categoryPath}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm space-y-1">
                    {app.ip && (
                      <div>
                        <span className="text-gray-500">IP:</span>
                        <span className="ml-1 font-mono text-gray-900">{app.ip}</span>
                      </div>
                    )}
                    {app.domain && (
                      <div>
                        <span className="text-gray-500">域名:</span>
                        <span className="ml-1 text-gray-900">{app.domain}</span>
                      </div>
                    )}
                    {app.url && (
                      <div>
                        <span className="text-gray-500">URL:</span>
                        <span className="ml-1 text-blue-600 truncate max-w-32 inline-block">
                          {app.url}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                                      <AppStatusBadge status={app.status} />
                </TableCell>
                
                <TableCell>
                  <ConfidenceBadge confidence={app.confidence} />
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {formatDate(app.createdAt)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <RowActions
                    isBuiltIn={app.isBuiltIn}
                    onView={() => onView(app)}
                    onEdit={() => onEdit(app)}
                    onDelete={() => onDelete(app.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* 批量操作 */}
      <BatchActions
        selectedCount={selectedApps.length}
        onBatchDelete={() => {
          onBatchDelete(selectedApps);
          setSelectedApps([]);
        }}
        onBatchExport={onBatchExport ? () => onBatchExport(selectedApps) : undefined}
        disabled={loading}
      />
    </Card>
  );
}

