import * as React from "react"

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = "" }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
