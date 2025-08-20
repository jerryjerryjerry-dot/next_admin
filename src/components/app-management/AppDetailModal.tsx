"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

import { Button } from "~/components/ui/button";
import { 
  ExternalLink, 
  Calendar, 
  Tag, 
  Network, 
  Database,
  Activity,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { AppEntry } from "~/types/api-response";

interface AppDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppEntry | null;
}

export function AppDetailModal({
  isOpen,
  onClose,
  app
}: AppDetailModalProps) {
  if (!app) {
    return null;
  }

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch {
      return '无效日期';
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-700 border-green-200" 
      : "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-100 text-gray-700";
    if (confidence >= 90) return "bg-green-100 text-green-700";
    if (confidence >= 70) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              {app.appName.charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-xl">{app.appName}</DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(app.status)}>
                  {app.status === "active" ? "活跃" : "非活跃"}
                </Badge>
                {app.isBuiltIn && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    内置应用
                  </Badge>
                )}
                {app.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-6 px-2"
                  >
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      访问
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">应用ID</label>
                  <p className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {app.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">应用类型</label>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {app.appType}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">分类路径</label>
                <div className="mt-1 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{app.categoryPath}</span>
                </div>
              </div>

              {app.confidence && (
                <div>
                  <label className="text-sm font-medium text-gray-500">识别置信度</label>
                  <div className="mt-1">
                    <Badge className={getConfidenceColor(app.confidence)}>
                      {app.confidence}%
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 网络配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                网络配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {app.ip && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IP地址</label>
                  <p className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {app.ip}
                  </p>
                </div>
              )}

              {app.domain && (
                <div>
                  <label className="text-sm font-medium text-gray-500">域名</label>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {app.domain}
                  </p>
                </div>
              )}

              {app.url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">完整URL</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <p className="flex-1 text-sm bg-gray-50 p-2 rounded break-all">
                      {app.url}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        访问
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {!app.ip && !app.domain && !app.url && (
                <div className="text-center py-8 text-gray-500">
                  <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无网络配置信息</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 状态信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                状态信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">当前状态</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(app.status)}>
                      <Activity className="h-3 w-3 mr-1" />
                      {app.status === "active" ? "活跃状态" : "非活跃状态"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">应用类型</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="flex items-center w-fit">
                      <Shield className="h-3 w-3 mr-1" />
                      {app.isBuiltIn ? "内置应用" : "自定义应用"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                时间信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {formatDate(app.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">更新时间</label>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {formatDate(app.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分类详情 */}
          {app.category && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  分类详情
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">分类名称</label>
                    <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                      {app.category.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">分类层级</label>
                    <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                      第 {(app.category.level ?? 0) + 1} 级
                    </p>
                  </div>
                </div>

                {app.category.appCount !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">该分类应用数量</label>
                    <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                      {app.category.appCount} 个应用
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

