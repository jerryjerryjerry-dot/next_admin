import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Copy, Key, Shield, Clock, Activity, BarChart3 } from "lucide-react";
import { type ApiKeyTableRow } from "~/types/openapi";
import { useToast } from "~/hooks/use-toast";

interface ViewApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKeyTableRow | null;
}

export function ViewApiKeyModal({ open, onOpenChange, apiKey }: ViewApiKeyModalProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, name: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "已复制",
        description: `${name}已复制到剪贴板`,
      });
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "无";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("zh-CN");
  };

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge variant="default">启用</Badge>;
      case "inactive":
        return <Badge variant="secondary">禁用</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API密钥详情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-4 w-4" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">密钥名称</label>
                  <p className="mt-1 text-sm text-gray-900">{apiKey.keyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">状态</label>
                  <div className="mt-1">
                    {getStatusBadge(apiKey.status, apiKey.isExpired)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">用途描述</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {apiKey.purpose || "无描述"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">AccessKey ID</label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded-md text-sm flex-1">
                    {apiKey.accessKeyId}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.accessKeyId, "AccessKey ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">AccessKey Secret</label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded-md text-sm flex-1">
                    {apiKey.accessKeySecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.accessKeySecret, "AccessKey Secret")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  密钥已加密显示，仅显示后4位
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 权限信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                权限信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">权限列表</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {apiKey.permissionLabels?.length > 0 ? (
                      apiKey.permissionLabels.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">无权限信息</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配额和使用情况 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                配额和使用情况
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">配额限制</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {apiKey.quotaLimit ? `${apiKey.quotaLimit.toLocaleString()} 次/月` : "无限制"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">已使用</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {apiKey.quotaUsed.toLocaleString()} 次
                  </p>
                </div>
              </div>

              {apiKey.quotaLimit && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-500">使用率</label>
                    <span className="text-sm text-gray-900">{apiKey.quotaUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        apiKey.quotaUsagePercent >= 90 ? "bg-red-500" :
                        apiKey.quotaUsagePercent >= 70 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(apiKey.quotaUsagePercent, 100)}%` }}
                    />
                  </div>
                  {apiKey.quotaUsagePercent >= 90 && (
                    <p className="text-sm text-red-600 mt-1">
                      配额使用率过高，建议及时增加配额限制
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                时间信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(apiKey.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">更新时间</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(apiKey.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">最后使用时间</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(apiKey.lastUsedAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">过期时间</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(apiKey.expiresAt)}
                  </p>
                  {apiKey.isExpired && (
                    <p className="text-sm text-red-600 mt-1">
                      此密钥已过期
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 使用活动 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                使用活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      apiKey.status === "active" && !apiKey.isExpired ? "bg-green-500" : "bg-gray-400"
                    }`} />
                    <span className="text-sm font-medium">
                      {apiKey.status === "active" && !apiKey.isExpired ? "活跃状态" : "非活跃状态"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {apiKey.lastUsedAt ? "最近有使用" : "从未使用"}
                  </span>
                </div>
                
                {apiKey.quotaLimit && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p>
                      本月还可调用 <strong>{(apiKey.quotaLimit - apiKey.quotaUsed).toLocaleString()}</strong> 次
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 安全建议 */}
          {(apiKey.isExpired || apiKey.quotaUsagePercent > 80 || !apiKey.lastUsedAt) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">安全建议</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {apiKey.isExpired && (
                    <li>密钥已过期，请及时更新过期时间或创建新密钥</li>
                  )}
                  {apiKey.quotaUsagePercent > 80 && (
                    <li>配额使用率过高，建议增加配额限制或优化API调用</li>
                  )}
                  {!apiKey.lastUsedAt && (
                    <li>密钥从未使用，如不需要请及时删除以减少安全风险</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            onClick={() => {
              const keyInfo = `密钥名称: ${apiKey.keyName}\nAccessKey ID: ${apiKey.accessKeyId}\nAccessKey Secret: ${apiKey.accessKeySecret}\n用途: ${apiKey.purpose}`;
              copyToClipboard(keyInfo, "密钥信息");
            }}
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-2" />
            复制密钥信息
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
