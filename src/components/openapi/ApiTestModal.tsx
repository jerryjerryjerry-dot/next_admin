"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Play, Copy, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { type ApiEndpointDetail } from "~/types/openapi";

interface ApiTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: ApiEndpointDetail;
}

export function ApiTestModal({ open, onOpenChange, endpoint }: ApiTestModalProps) {
  const { toast } = useToast();
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [testParameters, setTestParameters] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode: number;
    response: unknown;
    responseTime: number;
    error?: string;
  } | null>(null);

  // 获取可用的API密钥
  const { data: apiKeys = [] } = api.openApi.keys.getAll.useQuery();
  const availableKeys = apiKeys.filter(key => 
    key.status === 'active' && !key.isExpired
  );

  // API测试mutation
  const testMutation = api.openApi.testing.testEndpoint.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      toast({
        title: "API测试成功",
        description: `响应时间: ${data.responseTime}ms`,
      });
    },
    onError: (error) => {
      setTestResult({
        success: false,
        statusCode: 500,
        response: null,
        responseTime: 0,
        error: error.message,
      });
      toast({
        title: "API测试失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTest = () => {
    if (!selectedKeyId) {
      toast({
        title: "请选择API密钥",
        variant: "destructive",
      });
      return;
    }

    const selectedKey = availableKeys.find(key => key.id === selectedKeyId);
    if (!selectedKey) {
      toast({
        title: "选择的密钥无效",
        variant: "destructive",
      });
      return;
    }

    let parameters = {};
    try {
      if (testParameters.trim()) {
        parameters = JSON.parse(testParameters);
      }
    } catch (error) {
      toast({
        title: "参数格式错误",
        description: "请输入有效的JSON格式参数",
        variant: "destructive",
      });
      return;
    }

    testMutation.mutate({
      accessKeyId: selectedKey.accessKeyId,
      endpoint: endpoint.endpoint,
      method: endpoint.method,
      parameters,
      userAgent: "OpenAPI-Test-Tool/1.0",
      clientIp: "127.0.0.1",
    });
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast({ title: "已复制到剪贴板" });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedKeyId("");
    setTestParameters("");
    setTestResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            API接口测试 - {endpoint.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 端点信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">接口信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">请求方法</Label>
                  <div className="mt-1">
                    <Badge variant={endpoint.method === "GET" ? "default" : "secondary"}>
                      {endpoint.method}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">端点地址</Label>
                  <div className="mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </code>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">接口描述</Label>
                  <p className="mt-1 text-sm text-gray-800">{endpoint.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 测试配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">测试配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API密钥选择 */}
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  选择API密钥
                </Label>
                <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="请选择一个有效的API密钥" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableKeys.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        没有可用的API密钥，请先创建一个
                      </div>
                    ) : (
                      availableKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{key.keyName}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {key.accessKeyId}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 请求参数 */}
              <div>
                <Label htmlFor="parameters" className="text-sm font-medium">
                  请求参数 (JSON格式)
                </Label>
                <Textarea
                  id="parameters"
                  value={testParameters}
                  onChange={(e) => setTestParameters(e.target.value)}
                  placeholder={endpoint.requestSchema ? 
                    "请输入JSON格式的请求参数..." : 
                    "此接口无需参数"
                  }
                  className="mt-1 font-mono text-sm"
                  rows={6}
                />
                {endpoint.requestSchema && (
                  <div className="mt-2">
                    <Label className="text-xs text-gray-500">参数格式参考：</Label>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(JSON.parse(endpoint.requestSchema), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* 测试按钮 */}
              <Button 
                onClick={handleTest}
                disabled={testMutation.isPending || !selectedKeyId || availableKeys.length === 0}
                className="w-full"
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    发送测试请求
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 测试结果 */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  测试结果
                  <Badge 
                    variant={testResult.success ? "default" : "destructive"}
                    className="ml-auto"
                  >
                    {testResult.statusCode}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 响应时间和状态 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      响应时间: {testResult.responseTime}ms
                    </span>
                  </div>
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "成功" : "失败"}
                  </Badge>
                </div>

                {/* 错误信息 */}
                {testResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm text-red-800">
                      <strong>错误信息:</strong> {testResult.error}
                    </div>
                  </div>
                )}

                {/* 响应内容 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">响应内容</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(testResult.response, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      复制
                    </Button>
                  </div>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-64">
                    {JSON.stringify(testResult.response, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
