"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Network, 
  ExternalLink,
  Lightbulb,
  Check,
  X,
  Loader2
} from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface AISuggestion {
  id: string;
  ip?: string;
  domain?: string;
  url?: string;
  predictedType: string;
  confidence: number;
  reason: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function AILearningPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Mock数据作为fallback
  const mockSuggestions: AISuggestion[] = [
    {
      id: "ai_001",
      ip: "10.0.0.50",
      domain: "new-service.internal",
      predictedType: "数据库工具",
      confidence: 85.5,
      reason: "检测到数据库连接模式，端口3306通常用于MySQL",
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "ai_002",
      domain: "monitoring.example.com",
      url: "https://monitoring.example.com/metrics",
      predictedType: "监控工具",
      confidence: 92.3,
      reason: "URL路径包含metrics，典型的监控系统特征",
      status: "pending",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  // 获取AI建议数据
  const { 
    data: suggestions = mockSuggestions,
    isLoading,
    refetch 
  } = api.appManagement.aiSuggestions.getPending.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // 批准建议
  const approveMutation = api.appManagement.aiSuggestions.approve.useMutation({
    onSuccess: () => {
      void refetch();
      setSelectedSuggestions([]);
      setProcessingIds([]);
    },
    onError: (error) => {
      console.error("批准建议失败:", error);
      setProcessingIds([]);
    },
  });

  // 拒绝建议
  const rejectMutation = api.appManagement.aiSuggestions.reject.useMutation({
    onSuccess: () => {
      void refetch();
      setSelectedSuggestions([]);
      setProcessingIds([]);
    },
    onError: (error) => {
      console.error("拒绝建议失败:", error);
      setProcessingIds([]);
    },
  });

  const handleApprove = async (suggestionId: string) => {
    setProcessingIds(prev => [...prev, suggestionId]);
    
    try {
      await approveMutation.mutateAsync([suggestionId]);
    } catch (error) {
      console.error("批准失败:", error);
    }
  };

  const handleReject = async (suggestionId: string) => {
    setProcessingIds(prev => [...prev, suggestionId]);
    
    try {
      await rejectMutation.mutateAsync([suggestionId]);
    } catch (error) {
      console.error("拒绝失败:", error);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedSuggestions.length === 0) return;
    
    setProcessingIds(prev => [...prev, ...selectedSuggestions]);
    
    try {
      await approveMutation.mutateAsync(selectedSuggestions);
    } catch (error) {
      console.error("批量批准失败:", error);
    }
  };

  const handleBatchReject = async () => {
    if (selectedSuggestions.length === 0) return;
    
    setProcessingIds(prev => [...prev, ...selectedSuggestions]);
    
    try {
      await rejectMutation.mutateAsync(selectedSuggestions);
    } catch (error) {
      console.error("批量拒绝失败:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuggestions(suggestions.map(s => s.id));
    } else {
      setSelectedSuggestions([]);
    }
  };

  const handleSelectSuggestion = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSuggestions(prev => [...prev, id]);
    } else {
      setSelectedSuggestions(prev => prev.filter(sid => sid !== id));
    }
  };

  const formatDate = (date: Date) => {
    try {
      return format(date, 'MM-dd HH:mm', { locale: zhCN });
    } catch {
      return '无效日期';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const pendingSuggestions = suggestions.filter(s => s.status === "pending");
  const hasSelected = selectedSuggestions.length > 0;
  const isAllSelected = selectedSuggestions.length === pendingSuggestions.length && pendingSuggestions.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-500" />
            AI学习建议
            {pendingSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingSuggestions.length}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {hasSelected && (
              <>
                <span className="text-sm text-gray-600">
                  已选择 {selectedSuggestions.length} 项
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBatchApprove}
                  disabled={approveMutation.isPending}
                >
                  批量批准
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBatchReject}
                  disabled={rejectMutation.isPending}
                >
                  批量拒绝
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载AI建议...</span>
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无AI建议</h3>
              <p className="text-gray-500">AI正在学习中，暂时没有新的应用建议</p>
            </div>
          ) : (
            <>
              {/* 批量操作栏 */}
              {pendingSuggestions.length > 1 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600">
                      全选 ({pendingSuggestions.length} 项建议)
                    </span>
                  </div>
                </div>
              )}

              {/* 建议列表 */}
              <div className="space-y-4">
                {pendingSuggestions.map((suggestion) => {
                  const isSelected = selectedSuggestions.includes(suggestion.id);
                  const isProcessing = processingIds.includes(suggestion.id);

                  return (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "border rounded-lg p-4 transition-colors",
                        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        {pendingSuggestions.length > 1 && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSelectSuggestion(suggestion.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                        )}

                        <div className="flex-1 space-y-3">
                          {/* 网络信息 */}
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Network className="h-4 w-4 mr-1" />
                              网络信息:
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              {suggestion.ip && (
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                  IP: {suggestion.ip}
                                </span>
                              )}
                              {suggestion.domain && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  域名: {suggestion.domain}
                                </span>
                              )}
                              {suggestion.url && (
                                <div className="flex items-center">
                                  <span className="bg-gray-100 px-2 py-1 rounded mr-1">
                                    URL: {suggestion.url}
                                  </span>
                                  <a
                                    href={suggestion.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* AI分析结果 */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">预测分类:</span>
                              <Badge variant="outline">{suggestion.predictedType}</Badge>
                              <span className="text-sm text-gray-600">置信度:</span>
                              <Badge 
                                variant="outline" 
                                className={getConfidenceColor(suggestion.confidence)}
                              >
                                {suggestion.confidence}%
                              </Badge>
                            </div>
                            
                            <div className="text-sm">
                              <span className="text-gray-600">AI分析:</span>
                              <span className="ml-2 text-gray-900">{suggestion.reason}</span>
                            </div>
                          </div>

                          {/* 时间信息 */}
                          <div className="text-xs text-gray-500">
                            发现时间: {formatDate(suggestion.createdAt)}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(suggestion.id)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(suggestion.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

