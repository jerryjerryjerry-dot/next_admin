import * as React from "react";
import { cn } from "~/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ 
  children, 
  content, 
  side = "top", 
  className 
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const tooltipClasses = cn(
    "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg",
    "opacity-0 transition-opacity duration-200 pointer-events-none",
    "whitespace-nowrap",
    isVisible && "opacity-100",
    side === "top" && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    side === "bottom" && "top-full left-1/2 transform -translate-x-1/2 mt-2",
    side === "left" && "right-full top-1/2 transform -translate-y-1/2 mr-2",
    side === "right" && "left-full top-1/2 transform -translate-y-1/2 ml-2",
    className
  );

  const arrowClasses = cn(
    "absolute w-0 h-0",
    side === "top" && "top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900",
    side === "bottom" && "bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900",
    side === "left" && "left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900",
    side === "right" && "right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"
  );

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div className={tooltipClasses}>
        {content}
        <div className={arrowClasses} />
      </div>
    </div>
  );
}
