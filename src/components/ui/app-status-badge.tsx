import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { CheckCircle, XCircle, Clock, HelpCircle } from "lucide-react";

interface AppStatusBadgeProps {
  status: string; // 允许任何字符串值
  className?: string;
}

export function AppStatusBadge({ status, className }: AppStatusBadgeProps) {
  const statusConfig = {
    active: {
      label: "启用",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 hover:bg-green-200",
    },
    inactive: {
      label: "禁用", 
      variant: "secondary" as const,
      icon: XCircle,
      className: "bg-red-100 text-red-800 hover:bg-red-200",
    },
    processing: {
      label: "处理中",
      variant: "outline" as const,
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    },
  };

  // 防护逻辑：如果status不在预定义配置中，使用默认配置
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || "未知",
    variant: "outline" as const,
    icon: HelpCircle,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface BuiltInBadgeProps {
  isBuiltIn: boolean;
  className?: string;
}

export function BuiltInBadge({ isBuiltIn, className }: BuiltInBadgeProps) {
  if (!isBuiltIn) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs bg-blue-50 text-blue-700 border-blue-200",
        className
      )}
    >
      内置
    </Badge>
  );
}

interface ConfidenceBadgeProps {
  confidence?: number | null;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  if (!confidence) return null;

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-mono",
        getConfidenceColor(confidence),
        className
      )}
    >
      {confidence}%
    </Badge>
  );
}
