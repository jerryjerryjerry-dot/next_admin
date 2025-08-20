import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { Edit, Trash2, Play, Activity, FileText } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDye?: () => void;
  onTrace?: () => void;
  onReport?: () => void;
  disabled?: boolean;
  loading?: {
    dye?: boolean;
    trace?: boolean;
    report?: boolean;
  };
}

export function ActionButtons({
  onEdit,
  onDelete,
  onDye,
  onTrace,
  onReport,
  disabled = false,
  loading = {},
}: ActionButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      {onEdit && (
        <Tooltip content="编辑规则">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={disabled}
            className="h-8 px-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
      
      {onDye && (
        <Tooltip content="执行流量染色">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDye}
            disabled={disabled || loading.dye}
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {loading.dye ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
      )}
      
      {onTrace && (
        <Tooltip content="流量追踪分析">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTrace}
            disabled={disabled}
            className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <Activity className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
      
      {onReport && (
        <Tooltip content="生成分析报告">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReport}
            disabled={disabled}
            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
      
      {onDelete && (
        <Tooltip content="删除规则">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
