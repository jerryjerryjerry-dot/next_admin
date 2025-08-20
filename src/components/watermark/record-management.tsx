import { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, RotateCcw, FileText, Shield } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useToast } from "~/hooks/use-toast";

import { OPERATION_TYPES, STATUS_TYPES } from "~/types/watermark";
import type { WatermarkRecord } from "~/types/watermark";

export function RecordManagement() {
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterOperation, setFilterOperation] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<WatermarkRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<WatermarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 20
  });

  // 获取记录列表
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        keyword: searchKeyword,
        operation: filterOperation === 'all' ? '' : filterOperation,
        status: filterStatus === 'all' ? '' : filterStatus
      });

      const response = await fetch(`/api/watermark/records?${params}`);
      const result = await response.json() as {
        success: boolean;
        data: WatermarkRecord[];
        pagination: {
          total: number;
          totalPages: number;
          page: number;
          pageSize: number;
        };
      };

      if (result.success) {
        setRecords(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('获取记录列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 重试失败的记录
  const retryRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/watermark/records/${recordId}/retry`, {
        method: 'POST',
      });
      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        await fetchRecords(); // 重新获取列表
        toast({
          title: "重试请求已提交！",
          variant: "success",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "重试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 监听搜索条件变化
  useEffect(() => {
    void fetchRecords();
  }, [currentPage, searchKeyword, filterOperation, filterStatus]);

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN');
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    return STATUS_TYPES.find(s => s.value === status) || STATUS_TYPES[0];
  };

  // 获取操作类型配置
  const getOperationConfig = (operation: string) => {
    return OPERATION_TYPES.find(o => o.value === operation) || OPERATION_TYPES[0];
  };

  // 渲染操作按钮
  const renderActions = (record: any) => {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRecord(record)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {record.status === "completed" && record.result && (
          <>
            {record.operation === "embed" && JSON.parse(record.result)?.downloadUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a href={JSON.parse(record.result).downloadUrl} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
          </>
        )}

        {record.status === "failed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void retryRecord(record.id)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  // 渲染详情对话框
  const renderDetailDialog = () => {
    if (!selectedRecord) return null;

    const statusConfig = getStatusConfig(selectedRecord.status);
    const operationConfig = getOperationConfig(selectedRecord.operation);
    
    let result = null;
    if (selectedRecord.result) {
      try {
        result = JSON.parse(selectedRecord.result);
      } catch (e) {
        // ignore
      }
    }

    return (
      <Dialog open={true} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>记录详情</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">文件名</h4>
                <p className="text-sm text-gray-600">{selectedRecord.fileName}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">文件大小</h4>
                <p className="text-sm text-gray-600">{formatFileSize(selectedRecord.fileSize)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">操作类型</h4>
                <Badge variant="outline">
                  {operationConfig?.label}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">状态</h4>
                <Badge variant={
                  statusConfig?.color === "green" ? "success" :
                  statusConfig?.color === "blue" ? "info" :
                  statusConfig?.color === "red" ? "destructive" : "gray"
                }>
                  {statusConfig?.label}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">进度</h4>
                <p className="text-sm text-gray-600">{selectedRecord.progress}%</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">创建时间</h4>
                <p className="text-sm text-gray-600">{formatTime(selectedRecord.createdAt)}</p>
              </div>
            </div>

            {/* 水印文本（仅嵌入操作） */}
            {selectedRecord.operation === "embed" && selectedRecord.watermarkText && (
              <div>
                <h4 className="font-medium text-gray-900">水印文本</h4>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{selectedRecord.watermarkText}</p>
                </div>
              </div>
            )}

            {/* 处理结果 */}
            {result && selectedRecord.status === "completed" && (
              <div>
                <h4 className="font-medium text-gray-900">处理结果</h4>
                <div className="mt-2 space-y-3">
                  {selectedRecord.operation === "embed" && result.downloadUrl && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 mb-2">✅ 水印嵌入成功</p>
                      <Button asChild size="sm">
                        <a href={result.downloadUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          下载带水印文件
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  {selectedRecord.operation === "extract" && result.extractedContent && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800 mb-2">✅ 水印提取成功</p>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">提取内容：</span>
                          <p className="mt-1 text-sm bg-white p-2 rounded border">
                            {result.extractedContent}
                          </p>
                        </div>
                        {result.confidence && (
                          <p className="text-sm">
                            <span className="font-medium">置信度：</span>
                            {result.confidence}%
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {selectedRecord.errorMessage && (
              <div>
                <h4 className="font-medium text-gray-900">错误信息</h4>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{selectedRecord.errorMessage}</p>
                </div>
              </div>
            )}

            {/* 元数据 */}
            {selectedRecord.metadata && (
              <div>
                <h4 className="font-medium text-gray-900">元数据</h4>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedRecord.metadata), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">处理记录</h2>
        <p className="mt-1 text-sm text-gray-500">
          查看和管理所有水印处理操作的历史记录
        </p>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="搜索文件名或水印文本..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={filterOperation} onValueChange={setFilterOperation}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="操作类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {OPERATION_TYPES.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {STATUS_TYPES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
        </div>
      </Card>

      {/* 记录表格 */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <p>加载中...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>文件大小</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const statusConfig = getStatusConfig(record.status);
                const operationConfig = getOperationConfig(record.operation);
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-48">{record.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {operationConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        statusConfig?.color === "green" ? "success" :
                        statusConfig?.color === "blue" ? "info" :
                        statusConfig?.color === "red" ? "destructive" : "gray"
                      }>
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${record.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{record.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(record.fileSize)}</TableCell>
                    <TableCell>{formatTime(record.createdAt)}</TableCell>
                    <TableCell>{renderActions(record)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* 空状态 */}
        {!isLoading && records.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无记录</h3>
            <p className="text-gray-500">
              {searchKeyword || (filterOperation !== 'all') || (filterStatus !== 'all')
                ? "没有找到匹配的记录" 
                : "还没有处理过任何文件"}
            </p>
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 条记录，第 {currentPage} / {pagination.totalPages} 页
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 详情对话框 */}
      {renderDetailDialog()}
    </div>
  );
}
