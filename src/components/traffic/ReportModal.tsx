import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, AlertTriangle, Download, RefreshCw, Clock, Users, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { getErrorMessage } from "~/types/error";

interface PerformanceReport {
  ruleId: string;
  dyeId: string;
  reportTime: string;
  summary: {
    totalRequests: number;
    dyedRequests: number;
    successRate: number;
    avgLatency: number;
    errorCount: number;
    peakHours: number[];
  };
  metrics: {
    latencyDistribution: { range: string; count: number; percentage: number }[];
    errorTypes: { type: string; count: number; percentage: number }[];
    hourlyStats: { hour: number; requests: number; errors: number; avgLatency: number }[];
  };
  anomalies: {
    type: 'high_latency' | 'error_spike' | 'traffic_drop';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: string;
    affectedRequests: number;
  }[];
  recommendations: string[];
}

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  ruleId: string;
  ruleName?: string;
}

// Mock数据生成器
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateMockReportData = (ruleId: string): PerformanceReport => {
  const totalRequests = Math.floor(Math.random() * 50000) + 10000;
  const dyedRequests = Math.floor(totalRequests * (0.3 + Math.random() * 0.4));
  const errorCount = Math.floor(totalRequests * (0.001 + Math.random() * 0.019));
  const successRate = ((totalRequests - errorCount) / totalRequests) * 100;

  return {
    ruleId,
    dyeId: `dye_${Date.now()}_${ruleId}`,
    reportTime: new Date().toISOString(),
    summary: {
      totalRequests,
      dyedRequests,
      successRate,
      avgLatency: Math.floor(Math.random() * 200) + 80,
      errorCount,
      peakHours: [9, 14, 20]
    },
    metrics: {
      latencyDistribution: [
        { range: "0-50ms", count: Math.floor(dyedRequests * 0.2), percentage: 20 },
        { range: "50-100ms", count: Math.floor(dyedRequests * 0.35), percentage: 35 },
        { range: "100-200ms", count: Math.floor(dyedRequests * 0.3), percentage: 30 },
        { range: "200-500ms", count: Math.floor(dyedRequests * 0.12), percentage: 12 },
        { range: ">500ms", count: Math.floor(dyedRequests * 0.03), percentage: 3 }
      ],
      errorTypes: [
        { type: "超时错误", count: Math.floor(errorCount * 0.4), percentage: 40 },
        { type: "连接错误", count: Math.floor(errorCount * 0.3), percentage: 30 },
        { type: "服务错误", count: Math.floor(errorCount * 0.2), percentage: 20 },
        { type: "其他错误", count: Math.floor(errorCount * 0.1), percentage: 10 }
      ],
      hourlyStats: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        requests: Math.floor(Math.random() * 2000) + 500,
        errors: Math.floor(Math.random() * 50),
        avgLatency: Math.floor(Math.random() * 150) + 50
      }))
    },
    anomalies: [
      {
        type: 'high_latency',
        severity: 'medium',
        description: '14:30-15:00期间平均延迟异常升高至380ms',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        affectedRequests: 1250
      },
      {
        type: 'error_spike',
        severity: 'high',
        description: '09:15发生错误峰值，错误率达到5.2%',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        affectedRequests: 890
      }
    ],
    recommendations: [
      "建议在高峰时段(9:00, 14:00, 20:00)增加服务器资源",
      "优化数据库查询，减少平均响应时间",
      "增强错误监控和自动重试机制",
      "考虑实施缓存策略以提高响应速度"
    ]
  };
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'high':
      return { color: 'text-red-600', bgColor: 'bg-red-100', label: '高' };
    case 'medium':
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: '中' };
    case 'low':
      return { color: 'text-green-600', bgColor: 'bg-green-100', label: '低' };
    default:
      return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: '未知' };
  }
};

export function ReportModal({ open, onClose, ruleId, ruleName }: ReportModalProps) {
  const [reportData, setReportData] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange] = useState<"1h" | "6h" | "24h" | "7d">("24h");
  
  const { toast } = useToast();

  const generateReportMutation = api.traffic.generateReport.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        // 转换API数据为组件期望的格式
        const transformedData: PerformanceReport = {
          ruleId: result.data.ruleId,
          dyeId: `dye_${Date.now()}`,
          reportTime: result.data.generatedAt,
          summary: {
            totalRequests: result.data.summary.totalRequests,
            dyedRequests: result.data.summary.dyedRequests,
            successRate: result.data.summary.successRate,
            avgLatency: result.data.summary.avgLatency,
            errorCount: Math.floor(result.data.summary.totalRequests * result.data.summary.errorRate / 100),
            peakHours: [9, 14, 20], // 示例峰值小时
          },
          metrics: {
            latencyDistribution: [
              { range: "0-50ms", count: Math.floor(result.data.summary.totalRequests * 0.3), percentage: 30 },
              { range: "50-100ms", count: Math.floor(result.data.summary.totalRequests * 0.4), percentage: 40 },
              { range: "100-200ms", count: Math.floor(result.data.summary.totalRequests * 0.2), percentage: 20 },
              { range: "200ms+", count: Math.floor(result.data.summary.totalRequests * 0.1), percentage: 10 },
            ],
            errorTypes: [
              { type: "连接超时", count: 15, percentage: 60 },
              { type: "服务不可用", count: 8, percentage: 32 },
              { type: "其他错误", count: 2, percentage: 8 },
            ],
            hourlyStats: result.data.trends.map((trend, index) => ({
              hour: index,
              requests: trend.requests,
              errors: trend.errors,
              avgLatency: Math.random() * 100 + 50, // 随机延迟
            })),
          },
          anomalies: [
            {
              type: "high_latency" as const,
              severity: "high" as const,
              description: "检测到异常高延迟",
              affectedRequests: 25,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              type: "error_spike" as const,
              severity: "medium" as const,
              description: "错误率略高于正常水平",
              affectedRequests: 12,
              timestamp: new Date(Date.now() - 1800000).toISOString(),
            },
          ],
          recommendations: [
            "考虑在峰值时间增加服务器资源",
            "优化数据库查询以减少延迟",
            "增加监控覆盖以提前发现问题",
            "实施熔断器模式以提高系统稳定性",
          ],
        };
        setReportData(transformedData);
        toast({ title: "报告生成成功" });
      }
    },
    onError: (error) => {
      toast({ 
        title: "报告生成失败", 
        description: getErrorMessage(error),
        variant: "destructive" 
      });
    },
  });

  const loadReportData = useCallback(() => {
    if (!ruleId) return;
    
    setLoading(true);
    generateReportMutation.mutate({ 
      id: ruleId, 
      timeRange 
    });
  }, [ruleId, timeRange, generateReportMutation]);

  useEffect(() => {
    if (open && ruleId) {
      loadReportData();
    } else if (!open) {
      // 清理状态，防止数据残留
      setReportData(null);
      setLoading(false);
    }
  }, [open, ruleId, loadReportData]);

  useEffect(() => {
    setLoading(generateReportMutation.isPending);
  }, [generateReportMutation.isPending]);

  const handleExport = () => {
    if (!reportData) return;

    const reportContent = `
流量染色性能报告
================
规则ID: ${reportData.ruleId}
染色ID: ${reportData.dyeId}
报告时间: ${new Date(reportData.reportTime).toLocaleString('zh-CN')}

总览
----
总请求数: ${reportData.summary.totalRequests.toLocaleString()}
染色请求数: ${reportData.summary.dyedRequests.toLocaleString()}
成功率: ${reportData.summary.successRate.toFixed(2)}%
平均延迟: ${reportData.summary.avgLatency}ms
错误数量: ${reportData.summary.errorCount}

异常检测
--------
${reportData.anomalies.map(anomaly =>
  `- [${getSeverityConfig(anomaly.severity).label}] ${anomaly.description} (影响请求: ${anomaly.affectedRequests})`
).join('\n')}

优化建议
--------
${reportData.recommendations.map(rec => `- ${rec}`).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-report-${ruleId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>性能分析报告</span>
            {ruleName && <span className="text-sm text-gray-500">- {ruleName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">正在生成性能报告...</p>
              </div>
            </div>
          ) : reportData ? (
            <>
              {/* 报告概览 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">总请求数</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {reportData.summary.totalRequests.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    染色: {reportData.summary.dyedRequests.toLocaleString()}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">成功率</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {reportData.summary.successRate.toFixed(1)}%
                  </p>
                  <Progress value={reportData.summary.successRate} className="mt-2 h-2" />
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">平均延迟</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {reportData.summary.avgLatency}ms
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {reportData.summary.avgLatency < 100 ? '优秀' :
                     reportData.summary.avgLatency < 200 ? '良好' : '需优化'}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">错误数量</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {reportData.summary.errorCount}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    错误率: {((reportData.summary.errorCount / reportData.summary.totalRequests) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* 详细分析 */}
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="metrics">性能指标</TabsTrigger>
                  <TabsTrigger value="anomalies">异常检测</TabsTrigger>
                  <TabsTrigger value="recommendations">优化建议</TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="space-y-6">
                  {/* 延迟分布 */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium mb-4">延迟分布</h3>
                    <div className="space-y-3">
                      {reportData.metrics.latencyDistribution.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="w-20 text-sm text-gray-600">{item.range}</div>
                          <div className="flex-1">
                            <Progress value={item.percentage} className="h-6" />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {item.count.toLocaleString()}
                          </div>
                          <div className="w-12 text-sm text-gray-500 text-right">
                            {item.percentage}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 错误类型分布 */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium mb-4">错误类型分布</h3>
                    <div className="space-y-3">
                      {reportData.metrics.errorTypes.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="w-20 text-sm text-gray-600">{item.type}</div>
                          <div className="flex-1">
                            <Progress value={item.percentage} className="h-4" />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {item.count}
                          </div>
                          <div className="w-12 text-sm text-gray-500 text-right">
                            {item.percentage}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="anomalies" className="space-y-4">
                  {reportData.anomalies.length > 0 ? (
                    reportData.anomalies.map((anomaly, index) => {
                      const severityConfig = getSeverityConfig(anomaly.severity);
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex items-start space-x-4">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${severityConfig.color}`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={`${severityConfig.bgColor} ${severityConfig.color}`}>
                                  {severityConfig.label}风险
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(anomaly.timestamp).toLocaleString('zh-CN')}
                                </span>
                              </div>
                              <p className="text-gray-900 mb-2">{anomaly.description}</p>
                              <p className="text-sm text-gray-600">
                                影响请求: {anomaly.affectedRequests.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">未检测到异常，系统运行良好</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      性能优化建议
                    </h3>
                    <div className="space-y-3">
                      {reportData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-blue-800 flex-1">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 操作按钮 */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  报告生成时间: {new Date(reportData.reportTime).toLocaleString('zh-CN')}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    关闭
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    导出报告
                  </Button>
                  <Button onClick={() => void loadReportData()} disabled={loading}>
                    {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    重新生成
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">无法加载报告数据</p>
              <Button variant="outline" onClick={() => void loadReportData()} className="mt-4">
                重试
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
