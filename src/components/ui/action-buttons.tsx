import { Button } from "~/components/ui/button";
import { Edit, Trash2, Play, Activity, FileText } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDye?: () => void;
  onTrace?: () => void;
  onReport?: () => void;
  disabled?: boolean;
}

export function ActionButtons({
  onEdit,
  onDelete,
  onDye,
  onTrace,
  onReport,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          className="h-8 px-2"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      
      {onDye && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDye}
          disabled={disabled}
          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
      
      {onTrace && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTrace}
          disabled={disabled}
          className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <Activity className="h-4 w-4" />
        </Button>
      )}
      
      {onReport && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReport}
          disabled={disabled}
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
      
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
