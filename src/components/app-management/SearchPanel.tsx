"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { SearchParams } from "~/types/api-response";

interface SearchPanelProps {
  onSearch: (params: SearchParams) => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}

export function SearchPanel({ 
  onSearch, 
  onClear, 
  loading,
  className 
}: SearchPanelProps) {
  const [queryType, setQueryType] = useState<"ip" | "domain" | "url">("ip");
  const [queryValue, setQueryValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryValue.trim()) return;
    
    onSearch({ queryType, queryValue: queryValue.trim() });
  };

  const handleClear = () => {
    setQueryValue("");
    onClear();
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-3">
            {/* 查询类型选择 */}
            <div className="flex rounded-md border">
              {(["ip", "domain", "url"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQueryType(type)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                    queryType === type
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            {/* 查询输入框 */}
            <div className="flex-1 relative">
              <Input
                type="text"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                placeholder={`输入${queryType.toUpperCase()}进行搜索...`}
                className="pr-20"
              />
              {queryValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 搜索按钮 */}
            <Button
              type="submit"
              disabled={!queryValue.trim() || loading}
              className="px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "搜索中..." : "搜索"}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="text-sm text-gray-500">
            {queryType === "ip" && "支持IPv4和IPv6地址，支持部分匹配"}
            {queryType === "domain" && "支持完整域名和部分匹配"}
            {queryType === "url" && "支持完整URL和部分匹配"}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

