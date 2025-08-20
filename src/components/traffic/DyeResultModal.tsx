import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { DyeResult } from "~/types/traffic";

interface DyeResultModalProps {
  open: boolean;
  onClose: () => void;
  result: DyeResult | null;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "success":
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "执行成功"
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "执行失败"
      };
    case "processing":
      return {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        label: "执行中"
      };
    default:
      return {
        icon: AlertTriangle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        label: "未知状态"
      };
  }
};

export function DyeResultModal({ open, onClose, result }: DyeResultModalProps) {
  if (!result) return null;

  const statusConfig = getStatusConfig(result.status);
  const StatusIcon = statusConfig.icon;

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("zh-CN");
  };

  const getDuration = () => {
    if (!result.endTime) return "执行中...";
    const start = new Date(result.startTime).getTime();
    const end = new Date(result.endTime).getTime();
    const duration = Math.round((end - start) / 1000);
    return `${duration}秒`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            <span>染色执行结果</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 状态概览 */}
          <div className={`p-4 rounded-lg ${statusConfig.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {result.message}
                </p>
              </div>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                {result.status}
              </Badge>
            </div>
          </div>

          {/* 执行详情 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">执行详情</h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">染色ID：</span>
                <code className="block bg-gray-100 px-2 py-1 rounded mt-1 font-mono text-xs">
                  {result.dyeId}
                </code>
              </div>

              <div>
                <span className="text-gray-600">执行时长：</span>
                <span className="block font-medium mt-1">{getDuration()}</span>
              </div>

              <div>
                <span className="text-gray-600">影响请求数：</span>
                <span className="block font-medium mt-1 text-blue-600">
                  {result.affectedRequests.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-gray-600">染色率：</span>
                <span className="block font-medium mt-1 text-green-600">
                  {result.dyeRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm">
                <span className="text-gray-600">开始时间：</span>
                <span className="ml-2">{formatTime(result.startTime)}</span>
              </div>
              {result.endTime && (
                <div className="text-sm mt-1">
                  <span className="text-gray-600">结束时间：</span>
                  <span className="ml-2">{formatTime(result.endTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 染色率进度条 */}
          {result.status === "success" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">染色进度</span>
                <span className="font-medium">{result.dyeRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(result.dyeRate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
