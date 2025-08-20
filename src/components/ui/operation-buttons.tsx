import { Button } from "~/components/ui/button";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  RefreshCw,
  MoreVertical,
  Check,
  X,
  Brain
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

interface ActionButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

// 新建按钮
export function CreateButton({ 
  disabled, 
  loading, 
  onClick, 
  className, 
  children = "新建应用" 
}: ActionButtonProps) {
  return (
    <Button
      variant="default"
      size="sm"
      disabled={disabled ?? loading}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {children}
    </Button>
  );
}

// 编辑按钮
export function EditButton({ 
  disabled, 
  onClick, 
  className 
}: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Edit className="h-4 w-4" />
      编辑
    </Button>
  );
}

// 删除按钮
export function DeleteButton({ 
  disabled, 
  loading, 
  onClick, 
  className 
}: ActionButtonProps) {
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={disabled ?? loading}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      删除
    </Button>
  );
}

// 查看按钮
export function ViewButton({ 
  disabled, 
  onClick, 
  className 
}: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Eye className="h-4 w-4" />
      查看
    </Button>
  );
}

// 批量操作按钮
interface BatchActionsProps {
  selectedCount: number;
  onBatchDelete: () => void;
  onBatchExport?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BatchActions({ 
  selectedCount, 
  onBatchDelete, 
  onBatchExport, 
  disabled,
  className 
}: BatchActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-gray-600">
        已选择 {selectedCount} 项
      </span>
      
      {onBatchExport && (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onBatchExport}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        导出
      </Button>
      )}
      
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={onBatchDelete}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        批量删除
      </Button>
    </div>
  );
}

// 表格行操作按钮
interface RowActionsProps {
  isBuiltIn: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function RowActions({ 
  isBuiltIn, 
  onView, 
  onEdit, 
  onDelete,
  className 
}: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          查看详情
        </DropdownMenuItem>
        
        {!isBuiltIn && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 导入导出按钮组
interface ImportExportProps {
  onImport: () => void;
  onExport: () => void;
  loading?: boolean;
  className?: string;
}

export function ImportExportButtons({ 
  onImport, 
  onExport, 
  loading,
  className 
}: ImportExportProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={onImport}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        导入
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={onExport}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        导出
      </Button>
    </div>
  );
}

// AI建议操作按钮
interface AISuggestionActionsProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
  className?: string;
}

export function AISuggestionActions({ 
  selectedCount, 
  onApprove, 
  onReject, 
  loading,
  className 
}: AISuggestionActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-gray-600 flex items-center gap-1">
        <Brain className="h-4 w-4" />
        AI建议 ({selectedCount}项)
      </span>
      
      <Button
        variant="default"
        size="sm"
        disabled={loading}
        onClick={onApprove}
        className="gap-2"
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        批量采纳
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={onReject}
        className="gap-2"
      >
        <X className="h-4 w-4" />
        批量拒绝
      </Button>
    </div>
  );
}

// 刷新按钮
export function RefreshButton({ 
  loading, 
  onClick, 
  className 
}: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      刷新
    </Button>
  );
}
