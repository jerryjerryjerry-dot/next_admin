import { useState, useEffect, useRef } from "react";
import { Shield, Search, Download, AlertCircle, CheckCircle, Clock, Activity } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { FileUpload } from "./file-upload";

import { watermarkAPI } from "~/lib/watermark-api";
import { useToast } from "~/hooks/use-toast";

type OperationType = "embed" | "extract";

interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface ProcessingTask {
  taskId: string;
  operation: OperationType;
  status: string;
  progress: number;
  estimatedTime?: string;
  result?: {
    downloadUrl?: string;
    extractedContent?: string;
    confidence?: number;
  };
  error?: string;
}

export function WatermarkProcess() {
  const { toast } = useToast();
  const [operation, setOperation] = useState<OperationType>("embed");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [watermarkText, setWatermarkText] = useState("");
  const [processingTask, setProcessingTask] = useState<ProcessingTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingLogs, setPollingLogs] = useState<Array<{
    count: number;
    timestamp: string;
    taskStatus: string;
    progress: number;
    hasResult: boolean;
    estimatedTime?: string;
  }>>([]);

  // 使用ref来跟踪定时器，防止内存泄漏
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pollCountRef = useRef<number>(0);

  // 策略列表状态
  const [policies, setPolicies] = useState<Array<{
    id: string;
    name: string;
    description: string;
    watermarkText: string;
    sensitivity?: string;
  }>>([]);

  // 获取策略列表
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch('/api/watermark/policies?active=true');
        const result = await response.json() as {
          success: boolean;
          data: Array<{
            id: string;
            name: string;
            description: string;
            watermarkText: string;
            sensitivity?: string;
          }>;
        };
        
        if (result.success) {
          setPolicies(result.data);
        }
      } catch (error) {
        console.error('获取策略列表失败:', error);
      }
    };

    void fetchPolicies();
  }, []);

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // 文件上传处理
  const handleFileUpload = async (file: File) => {
    const result = await watermarkAPI.uploadFile(file);
    // 上传成功后设置文件信息
    setUploadedFile({
      fileUrl: result.fileUrl,
      fileName: result.fileName,
      fileSize: result.fileSize,
    });
    return result;
  };

  const handleFileSelect = (_file: File) => {
    // 文件选择时重置状态
    setUploadedFile(null);
    setProcessingTask(null);
  };

  // 开始处理水印
  const handleProcess = async () => {
    if (!uploadedFile) {
      toast({
        title: "请先上传文件",
        variant: "warning",
      });
      return;
    }

    if (operation === "embed") {
      if (!selectedPolicy) {
        toast({
          title: "请选择水印策略",
          variant: "warning",
        });
        return;
      }
      if (!watermarkText.trim()) {
        toast({
          title: "请输入水印文本",
          variant: "warning",
        });
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      let result;
      
      if (operation === "embed") {
        result = await watermarkAPI.embedWatermark(
          uploadedFile.fileUrl,
          watermarkText.trim()
        );
      } else {
        result = await watermarkAPI.extractWatermark(
          uploadedFile.fileUrl
        );
      }

      // 设置处理任务状态
      setProcessingTask({
        taskId: result.taskId,
        operation,
        status: "processing",
        progress: 10,
      });

      // 开始轮询任务状态
      startPolling(result.taskId);
      
    } catch (error) {
      console.error("处理失败:", error);
      toast({
        title: "处理失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // 清理现有定时器的辅助函数
  const clearTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };



  // 轮询任务状态
  const startPolling = (taskId: string) => {
    // 清理之前的定时器
    clearTimers();
    
    // 重置计数器和日志
    startTimeRef.current = Date.now();
    pollCountRef.current = 0;
    setPollingLogs([]);
    
    pollIntervalRef.current = setInterval(() => {
      void (async () => {
        try {
          // 使用watermarkAPI查询任务状态
          const statusResult = await watermarkAPI.getTaskStatus(taskId) as {
            data: {
              status: string;
              progress: number;
              estimatedTime: string;
              result?: {
                downloadUrl?: string;
                extractedContent?: string;
                confidence?: number;
              };
            };
          };
          
          // 更新轮询计数
          pollCountRef.current += 1;
          
          // 获取任务状态
          const taskStatus = statusResult.data.status;
          const progress = statusResult.data.progress;
          const estimatedTime = statusResult.data.estimatedTime;
          const hasResult = !!statusResult.data.result && (
            !!statusResult.data.result.downloadUrl || 
            !!statusResult.data.result.extractedContent
          );
          
          // 添加轮询日志
          setPollingLogs(prev => [...prev, {
            count: pollCountRef.current,
            timestamp: new Date().toLocaleTimeString(),
            taskStatus: taskStatus,
            progress: progress,
            hasResult: hasResult,
            estimatedTime: estimatedTime
          }]);
          
          console.log(`🔍 轮询 #${pollCountRef.current}:`, {
            taskStatus,
            progress,
            hasResult,
            result: statusResult.data.result
          });
          
          setProcessingTask(prev => prev ? {
            ...prev,
            progress: progress,
            estimatedTime: estimatedTime,
            status: taskStatus === 'finished' ? 'completed' : 
                   taskStatus === 'failed' ? 'failed' : 'processing',
          } : null);

          // 修改停止条件：必须是finished且有result，或者是failed
          if ((taskStatus === "finished" && hasResult) || taskStatus === "failed") {
            clearTimers();
            setIsProcessing(false);
            
            if (taskStatus === "finished") {
              // 处理成功结果
              const result = statusResult.data.result;
              setProcessingTask(prev => prev ? {
                ...prev,
                status: "completed",
                progress: 100,
                result: {
                  downloadUrl: result?.downloadUrl,
                  extractedContent: result?.extractedContent,
                  confidence: result?.confidence,
                },
              } : null);
              
              toast({
                title: operation === 'embed' ? "水印嵌入成功！" : "水印提取成功！",
                description: operation === 'embed' ? "文件已成功添加水印" : "已成功提取水印内容",
                variant: "success",
              });
            } else {
              // 处理失败结果
              const errorMessage = "处理失败";
              setProcessingTask(prev => prev ? {
                ...prev,
                status: "failed",
                progress: 0,
                error: errorMessage,
              } : null);
              
              toast({
                title: "处理失败",
                description: errorMessage,
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("状态查询失败:", error);
          
          // 查询失败时，停止轮询并显示错误
          clearTimers();
          setIsProcessing(false);
          setProcessingTask(prev => prev ? {
            ...prev,
            status: "failed",
            progress: 0,
            error: "状态查询失败",
          } : null);
          
          toast({
            title: "状态查询失败",
            description: error instanceof Error ? error.message : "无法获取任务状态",
            variant: "destructive",
          });
        }
      })();
    }, 2000); // 每2秒查询一次

    // 5分钟后停止轮询
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setIsProcessing(false);
      
      toast({
        title: "处理超时",
        description: "任务处理时间过长，请稍后手动查看结果",
        variant: "warning",
      });
    }, 5 * 60 * 1000);
  };

  // 重置表单
  const handleReset = () => {
    clearTimers(); // 清理定时器
    setUploadedFile(null);
    setSelectedPolicy("");
    setWatermarkText("");
    setProcessingTask(null);
    setIsProcessing(false);
    setPollingLogs([]);
  };

  // 使用测试PDF URL
  const handleTestWithPdfUrl = () => {
    const testPdfUrl = "https://dxysbackend4.vercel.app/files/1755694993903_e6fe9f8a6d46da91e4dc4d959493b9b4.pdf";
    setUploadedFile({
      fileUrl: testPdfUrl,
      fileName: "test-document.pdf",
      fileSize: 1024000
    });
    setWatermarkText("测试水印文本");
    toast({
      title: "测试URL已设置",
      description: "使用Vercel上的测试PDF文件",
      variant: "success"
    });
  };

  // 渲染状态图标
  const renderStatusIcon = () => {
    if (!processingTask) return null;
    
    switch (processingTask.status) {
      case "processing":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">文件水印处理</h2>
        <p className="mt-1 text-sm text-gray-500">
          上传文件进行水印嵌入或提取操作
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧操作面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 测试区域 */}
          <Card className="p-4 border-dashed border-blue-300 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">快速测试</h3>
                <p className="text-xs text-blue-700">使用预设的PDF文件进行测试</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWithPdfUrl}
                disabled={isProcessing}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                使用测试PDF
              </Button>
            </div>
          </Card>

          {/* 操作类型选择 */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">选择操作类型</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={operation === "embed" ? "default" : "outline"}
                  onClick={() => setOperation("embed")}
                  className="h-20 flex-col space-y-2"
                  disabled={isProcessing}
                >
                  <Shield className="h-6 w-6" />
                  <span>嵌入水印</span>
                </Button>
                <Button
                  variant={operation === "extract" ? "default" : "outline"}
                  onClick={() => setOperation("extract")}
                  className="h-20 flex-col space-y-2"
                  disabled={isProcessing}
                >
                  <Search className="h-6 w-6" />
                  <span>提取水印</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* 文件上传 */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">上传文件</h3>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileUpload={handleFileUpload}
                className="w-full"
              />
              {uploadedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-green-800">文件上传成功</h4>
                        <p className="text-sm text-green-700">文件已准备好进行水印处理</p>
                      </div>
                      
                      <div className="space-y-1 text-xs text-green-600">
                        <div className="flex justify-between">
                          <span>文件名:</span>
                          <span className="font-mono">{uploadedFile.fileName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>文件大小:</span>
                          <span>{(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>文件URL:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs max-w-[200px] truncate">
                              {uploadedFile.fileUrl}
                            </span>
                            <a 
                              href={uploadedFile.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              预览
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-xs text-green-600">
                          💡 水印服务将使用此URL处理您的文件
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 嵌入水印配置 */}
          {operation === "embed" && uploadedFile && (
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">水印配置</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="policy">选择策略</Label>
                    <Select value={selectedPolicy} onValueChange={setSelectedPolicy} disabled={isProcessing}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择水印策略" />
                      </SelectTrigger>
                      <SelectContent>
                        {policies.map((policy) => (
                          <SelectItem key={policy.id} value={policy.id}>
                            <div className="flex items-center space-x-2">
                              <span>{policy.name}</span>
                              <Badge variant={
                                policy.sensitivity === "high" ? "destructive" :
                                policy.sensitivity === "medium" ? "warning" : "success"
                              }>
                                {policy.sensitivity === "high" ? "高密级" :
                                 policy.sensitivity === "medium" ? "中密级" : "低密级"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="watermark-text">水印文本</Label>
                    <Textarea
                      id="watermark-text"
                      placeholder="请输入要嵌入的水印文本，如：公司机密 - 张三 - 2024年1月"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      disabled={isProcessing}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 操作按钮 */}
          {uploadedFile && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">
                    {operation === "embed" ? "开始嵌入水印" : "开始提取水印"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {operation === "embed" 
                      ? "将为您的文件添加数字水印保护" 
                      : "将从文件中提取水印信息"}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                    重置
                  </Button>
                  <Button onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing ? "处理中..." : "开始处理"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 右侧状态面板 */}
        <div className="space-y-6">
          {/* 处理状态 */}
          {processingTask && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {renderStatusIcon()}
                  <h3 className="text-lg font-medium">处理状态</h3>
                </div>

                {processingTask.status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>进度</span>
                      <span>{processingTask.progress}%</span>
                    </div>
                    <Progress value={processingTask.progress} className="h-2" />
                    {processingTask.estimatedTime && (
                      <p className="text-sm text-gray-500">{processingTask.estimatedTime}</p>
                    )}
                  </div>
                )}

                {processingTask.status === "completed" && processingTask.result && (
                  <div className="space-y-3">
                    <Badge variant="success" className="w-full justify-center">
                      处理完成
                    </Badge>
                    
                    {operation === "embed" && processingTask.result.downloadUrl && (
                      <Button asChild className="w-full">
                        <a href={processingTask.result.downloadUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          下载带水印文件
                        </a>
                      </Button>
                    )}

                    {operation === "extract" && processingTask.result.extractedContent && (
                      <div className="space-y-2">
                        <Label>提取的水印内容：</Label>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm">{processingTask.result.extractedContent}</p>
                        </div>
                        {processingTask.result.confidence && (
                          <p className="text-sm text-gray-500">
                            置信度：{processingTask.result.confidence}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {processingTask.status === "failed" && (
                  <div className="space-y-3">
                    <Badge variant="destructive" className="w-full justify-center">
                      处理失败
                    </Badge>
                    <p className="text-sm text-red-600">{processingTask.error}</p>
                    <Button variant="outline" onClick={handleReset} className="w-full">
                      重新开始
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 帮助信息 */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">操作说明</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. 选择操作类型（嵌入或提取水印）</p>
                <p>2. 上传需要处理的文件</p>
                {operation === "embed" && (
                  <>
                    <p>3. 选择合适的水印策略</p>
                    <p>4. 输入水印文本内容</p>
                  </>
                )}
                <p>{operation === "embed" ? "5" : "3"}. 点击开始处理并等待完成</p>
              </div>
            </div>
          </Card>

          {/* 轮询日志 */}
          {pollingLogs.length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium">轮询日志</h3>
                  <Badge variant="outline">{pollingLogs.length}</Badge>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pollingLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 rounded-md text-sm space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">轮询 #{log.count}</span>
                        <span className="text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>状态: <span className="font-medium">{log.taskStatus}</span></div>
                        <div>进度: <span className="font-medium">{log.progress}%</span></div>
                        <div>有结果: <span className={`font-medium ${log.hasResult ? 'text-green-600' : 'text-gray-500'}`}>
                          {log.hasResult ? '是' : '否'}
                        </span></div>
                        <div>预估: <span className="text-gray-600">{log.estimatedTime}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {isProcessing && (
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>轮询中...</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
