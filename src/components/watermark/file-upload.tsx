import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileUpload: (file: File) => Promise<{ fileUrl: string; fileName: string; fileSize: number }>;
  className?: string;
  maxSize?: number; // 字节
  acceptedTypes?: string[];
}

export function FileUpload({ 
  onFileSelect, 
  onFileUpload, 
  className,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
  } | null>(null);

  // 使用ref跟踪定时器，防止内存泄漏
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器的辅助函数
  const clearTimers = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > maxSize) {
      setUploadError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // 验证文件类型
    const nameParts = file.name.split('.');
    if (nameParts.length < 2) {
      setUploadError('文件名必须包含扩展名');
      return;
    }
    const fileExtension = '.' + nameParts.pop()!.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setUploadError(`不支持的文件格式，仅支持：${acceptedTypes.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadResult(null);
    onFileSelect(file);
  }, [maxSize, acceptedTypes, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    multiple: false,
    maxSize,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    // 清理之前的定时器
    clearTimers();

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 模拟上传进度
      progressIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            return 90;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      const result = await onFileUpload(selectedFile);
      
      // 清理进度定时器
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setUploadProgress(100);
      setUploadResult(result);
      
      // 短暂延迟后重置进度条
      resetTimeoutRef.current = setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      clearTimers(); // 清理所有定时器
      setUploadError(error instanceof Error ? error.message : '上传失败');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    clearTimers(); // 清理定时器
    setSelectedFile(null);
    setUploadError(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 文件拖拽区域 */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive && "border-blue-500 bg-blue-50",
            "hover:border-gray-400 hover:bg-gray-50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? "拖放文件到这里" : "拖拽文件到这里，或点击选择"}
            </p>
            <p className="text-sm text-gray-500">
              支持 {acceptedTypes.join(', ')} 格式，最大 {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      )}

      {/* 选中的文件信息 */}
      {selectedFile && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 上传进度 */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传中...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* 上传按钮 */}
          {!uploadResult && !uploadError && (
            <div className="mt-4">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "上传中..." : "开始上传"}
              </Button>
            </div>
          )}

          {/* 上传成功 */}
          {uploadResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ 文件上传成功！文件大小：{formatFileSize(uploadResult.fileSize)}
              </p>
            </div>
          )}

          {/* 上传错误 */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-800">{uploadError}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
