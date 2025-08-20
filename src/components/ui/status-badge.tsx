import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "inactive" | "processing";
  className?: string;
}

const statusConfig = {
  active: {
    label: "活跃",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  inactive: {
    label: "禁用",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  processing: {
    label: "处理中",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
