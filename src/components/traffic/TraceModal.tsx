import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";

interface TraceNode {
  ip: string;
  name: string;
  timestamp: string;
  latency: number;
  status: 'success' | 'failed' | 'processing';
}

interface TraceInfo {
  dyeId: string;
  path: TraceNode[];
  currentNode: string;
  status: 'success' | 'failed' | 'processing';
  totalLatency: number;
  startTime: string;
  endTime?: string;
}

interface TraceModalProps {
  open: boolean;
  onClose: () => void;
  ruleId: string;
  ruleName?: string;
}

// Mock数据生成器
const generateMockTraceData = (ruleId: string): TraceInfo => {
  const nodes = [
    { name: "入口网关", ip: "192.168.1.1" },
    { name: "负载均衡器", ip: "192.168.1.10" },
    { name: "API网关", ip: "192.168.1.20" },
    { name: "业务服务", ip: "192.168.1.30" },
    { name: "数据库", ip: "192.168.1.40" },
    { name: "缓存服务", ip: "192.168.1.50" }
  ];

  const pathLength = Math.floor(Math.random() * 3) + 4; // 4-6个节点
  const selectedNodes = nodes.slice(0, pathLength);
  const currentTime = Date.now();

  const path: TraceNode[] = selectedNodes.map((node, index) => {
    const timestamp = new Date(currentTime + index * 1000).toISOString();
    const latency = Math.floor(Math.random() * 200) + 50; // 50-250ms
    const status = index < pathLength - 1 ? 'success' :
                  (Math.random() > 0.8 ? 'failed' : 'processing');

    return {
      ...node,
      timestamp,
      latency,
      status: status
    };
  });

  const totalLatency = path.reduce((sum, node) => sum + node.latency, 0);
  const currentNodeIndex = path.findIndex(node => node.status === 'processing');
  const currentNode = currentNodeIndex >= 0 ? path[currentNodeIndex]!.name : path[path.length - 1]!.name;

  return {
    dyeId: `dye_${Date.now()}_${ruleId}`,
    path,
    currentNode,
    status: path.some(node => node.status === 'failed') ? 'failed' :
            path.some(node => node.status === 'processing') ? 'processing' : 'success',
    totalLatency,
    startTime: path[0]!.timestamp,
    endTime: path.every(node => node.status === 'success') ? path[path.length - 1]!.timestamp : undefined
  };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'success':
      return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: '成功' };
    case 'failed':
      return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: '失败' };
    case 'processing':
      return { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-100', label: '处理中' };
    default:
      return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: '未知' };
  }
};

export function TraceModal({ open, onClose, ruleId, ruleName }: TraceModalProps) {
  const [traceData, setTraceData] = useState<TraceInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTraceData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockData = generateMockTraceData(ruleId);
      setTraceData(mockData);
    } catch (error) {
      console.error('加载追踪数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [ruleId]);

  useEffect(() => {
    if (open && ruleId) {
      void loadTraceData();
    } else if (!open) {
      // 清理状态，防止数据残留
      setTraceData(null);
      setLoading(false);
    }
  }, [open, ruleId, loadTraceData]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('zh-CN');
  };

  const getProgress = () => {
    if (!traceData) return 0;
    const completedNodes = traceData.path.filter(node => node.status === 'success').length;
    return (completedNodes / traceData.path.length) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>流量追踪</span>
            {ruleName && <span className="text-sm text-gray-500">- {ruleName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">正在追踪流量路径...</p>
              </div>
            </div>
          ) : traceData ? (
            <>
              {/* 追踪概览 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">染色ID</span>
                    <p className="font-mono text-sm bg-white px-2 py-1 rounded mt-1">
                      {traceData.dyeId}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">当前节点</span>
                    <p className="font-medium mt-1">{traceData.currentNode}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">总延迟</span>
                    <p className="font-medium mt-1 text-blue-600">{traceData.totalLatency}ms</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">状态</span>
                    <div className="mt-1">
                      <Badge className={`${getStatusConfig(traceData.status).bgColor} ${getStatusConfig(traceData.status).color}`}>
                        {getStatusConfig(traceData.status).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>追踪进度</span>
                    <span>{Math.round(getProgress())}%</span>
                  </div>
                  <Progress value={getProgress()} className="h-2" />
                </div>
              </div>

              {/* 路径追踪 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">流量路径</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadTraceData()}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                  </Button>
                </div>

                <div className="space-y-3">
                  {traceData.path.map((node, index) => {
                    const statusConfig = getStatusConfig(node.status);
                    const StatusIcon = statusConfig.icon;
                    const isLast = index === traceData.path.length - 1;

                    return (
                      <div key={index} className="relative">
                        {/* 连接线 */}
                        {!isLast && (
                          <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
                        )}

                        {/* 节点信息 */}
                        <div className="flex items-start space-x-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
                            <StatusIcon className={`w-6 h-6 ${statusConfig.color} ${node.status === 'processing' ? 'animate-spin' : ''}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{node.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                步骤 {index + 1}
                              </Badge>
                            </div>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">IP地址：</span>
                                <span className="font-mono">{node.ip}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">延迟：</span>
                                <span className={node.latency > 200 ? 'text-red-600' : 'text-green-600'}>
                                  {node.latency}ms
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">时间：</span>
                                <span>{formatTime(node.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  关闭
                </Button>
                <Button onClick={() => void loadTraceData()} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  重新追踪
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">无法加载追踪数据</p>
              <Button variant="outline" onClick={() => void loadTraceData()} className="mt-4">
                重试
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
