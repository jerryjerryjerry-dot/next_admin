"use client";

import { useState } from "react";
import { 
  Download, 
  FileText, 
  Database, 
  FileJson,
  Users,
  BarChart3,
  X,
  CheckCircle
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { useToast } from "~/hooks/use-toast";
import { type UserProfile } from "~/types/user-management";
import { exportUserData, exportUserStats } from "~/utils/export-utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  stats?: any;
}

export function ExportModal({ isOpen, onClose, users, stats }: ExportModalProps) {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('excel');
  const [selectedType, setSelectedType] = useState<'users' | 'stats'>('users');
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'excel' as const,
      name: 'Excel表格',
      description: '适合在Excel中查看和编辑',
      icon: FileText,
      fileExtension: '.csv',
      color: 'text-green-600'
    },
    {
      id: 'csv' as const,
      name: 'CSV文件',
      description: '通用格式，可在多种软件中打开',
      icon: Database,
      fileExtension: '.csv',
      color: 'text-blue-600'
    },
    {
      id: 'json' as const,
      name: 'JSON数据',
      description: '结构化数据，适合程序处理',
      icon: FileJson,
      fileExtension: '.json',
      color: 'text-purple-600'
    }
  ];

  const exportTypes = [
    {
      id: 'users' as const,
      name: '用户数据',
      description: `导出所有用户详细信息 (${users.length} 条记录)`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'stats' as const,
      name: '统计报告',
      description: '导出用户统计数据和分析报告',
      icon: BarChart3,
      color: 'text-green-600'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (selectedType === 'users') {
        if (users.length === 0) {
          toast({
            title: "⚠️ 导出失败",
            description: "没有用户数据可以导出",
            variant: "destructive",
          });
          return;
        }

        await exportUserData(users, {
          format: selectedFormat,
          filename: `用户数据_${new Date().toISOString().slice(0, 10)}`
        });

        toast({
          title: "✅ 导出成功",
          description: `已成功导出 ${users.length} 条用户记录`,
        });
      } else {
        if (!stats) {
          toast({
            title: "⚠️ 导出失败",
            description: "统计数据不可用",
            variant: "destructive",
          });
          return;
        }

        await exportUserStats(stats, `用户统计报告_${new Date().toISOString().slice(0, 10)}`);

        toast({
          title: "✅ 导出成功",
          description: "已成功导出用户统计报告",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: "❌ 导出失败",
        description: error instanceof Error ? error.message : "导出过程中发生错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-gray-200 scrollbar-hide max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center mr-3">
              <Download className="w-4 h-4 text-white" />
            </div>
            数据导出
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 导出类型选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">导出内容</Label>
            <div className="grid grid-cols-1 gap-3">
              {exportTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`
                    relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${selectedType === type.id 
                      ? 'border-gray-600 bg-gray-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100 ${type.color}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{type.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    {selectedType === type.id && (
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 导出格式选择 */}
          {selectedType === 'users' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">导出格式</Label>
              <div className="grid grid-cols-1 gap-3">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`
                      relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                      ${selectedFormat === format.id 
                        ? 'border-gray-600 bg-gray-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-gray-100 ${format.color}`}>
                        <format.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{format.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                        <p className="text-xs text-gray-500 mt-1">文件扩展名: {format.fileExtension}</p>
                      </div>
                      {selectedFormat === format.id && (
                        <CheckCircle className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 导出说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">📋 导出说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 导出的文件会自动下载到您的设备</li>
              <li>• 文件名包含导出日期以便识别</li>
              <li>• Excel和CSV格式便于在表格软件中查看</li>
              <li>• JSON格式适合程序化处理和数据交换</li>
              {selectedType === 'users' && <li>• 用户密码等敏感信息不会包含在导出文件中</li>}
            </ul>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "导出中..." : "开始导出"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
