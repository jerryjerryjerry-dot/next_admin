import { useState, useRef } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface ImportExportDialogProps {
  isImportOpen: boolean;
  isExportOpen: boolean;
  onImportClose: () => void;
  onExportClose: () => void;
  onImportFile: (file: File) => void;
  onExportAll: () => void;
  totalApps: number;
}

export function ImportExportDialog({
  isImportOpen,
  isExportOpen,
  onImportClose,
  onExportClose,
  onImportFile,
  onExportAll,
  totalApps
}: ImportExportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.type === "application/json" || file.name.endsWith('.json'));
    
    if (jsonFile) {
      onImportFile(jsonFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <>
      {/* 导入对话框 */}
      <Dialog open={isImportOpen} onOpenChange={onImportClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-3">
              <Upload className="h-6 w-6 text-green-600" />
              导入应用数据
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 说明信息 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">导入格式说明:</p>
                    <ul className="text-gray-600 space-y-1 ml-4">
                      <li>• 支持 JSON 格式文件</li>
                      <li>• 文件大小不超过 10MB</li>
                      <li>• 重复应用将被跳过</li>
                      <li>• 无效数据将被忽略</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 拖拽上传区域 */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragOver 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-sm text-gray-500 mb-4">
                支持 .json 格式
              </p>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                选择文件
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* 示例格式 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">JSON格式示例</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "apps": [
    {
      "appName": "示例应用",
      "appType": "分类ID",
      "ip": "192.168.1.100",
      "domain": "example.com",
      "url": "https://example.com",
      "status": "active"
    }
  ]
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导出对话框 */}
      <Dialog open={isExportOpen} onOpenChange={onExportClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-3">
              <Download className="h-6 w-6 text-blue-600" />
              导出应用数据
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 导出统计 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">应用数据</p>
                      <p className="text-sm text-gray-500">
                        将导出 {totalApps} 个应用的完整数据
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {totalApps} 项
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 导出内容说明 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">导出内容包括:</p>
                    <ul className="text-gray-600 space-y-1 ml-4">
                      <li>• 应用名称和分类信息</li>
                      <li>• 网络配置 (IP、域名、URL)</li>
                      <li>• 状态和置信度数据</li>
                      <li>• 创建和更新时间</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 注意事项 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">注意事项:</p>
                    <p className="text-gray-600 mt-1">
                      导出的数据包含敏感信息，请妥善保管。建议在安全的环境中使用导出文件。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 导出按钮 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onExportClose}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={onExportAll}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                开始导出
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
