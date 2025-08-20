"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FolderTree, RefreshCw, Folder, FolderOpen } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

interface CategoryTreeProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
}

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  appCount?: number;
  children?: CategoryNode[];
}

export function CategoryTree({ 
  selectedCategoryId, 
  onCategorySelect,
  className 
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["all"]));

  // 使用Mock数据作为fallback
  const mockCategories: CategoryNode[] = [
    {
      id: "all",
      name: "全部分类",
      parentId: null,
      level: 0,
      isLeaf: false,
      appCount: 12,
      children: [
        {
          id: "system-tools",
          name: "系统工具",
          parentId: "all",
          level: 1,
          isLeaf: false,
          appCount: 8,
          children: [
            { id: "network-tools", name: "网络工具", parentId: "system-tools", level: 2, isLeaf: true, appCount: 3 },
            { id: "monitor-tools", name: "监控工具", parentId: "system-tools", level: 2, isLeaf: true, appCount: 2 },
            { id: "security-tools", name: "安全工具", parentId: "system-tools", level: 2, isLeaf: true, appCount: 3 },
          ]
        },
        {
          id: "dev-tools",
          name: "开发工具",
          parentId: "all",
          level: 1,
          isLeaf: false,
          appCount: 4,
          children: [
            { id: "ide-tools", name: "IDE工具", parentId: "dev-tools", level: 2, isLeaf: true, appCount: 1 },
            { id: "db-tools", name: "数据库工具", parentId: "dev-tools", level: 2, isLeaf: true, appCount: 3 },
          ]
        }
      ]
    }
  ];

  // 尝试从API获取数据，失败时使用Mock数据
  const { 
    data: apiData, 
    isLoading, 
    error,
    refetch 
  } = api.appManagement.categories.getTree.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // 转换 API 数据到 CategoryNode 格式
  const categories: CategoryNode[] = apiData ? apiData.map((item: {
    id: string;
    name: string;
    parentId: string | null;
    level: number;
    isLeaf: boolean;
    appCount?: number;
    children?: Array<{
      id: string;
      name: string;
      parentId: string | null;
      level: number;
      isLeaf: boolean;
      appCount?: number;
      children?: Array<{
        id: string;
        name: string;
        parentId: string | null;
        level: number;
        isLeaf: boolean;
        appCount?: number;
      }>;
    }>;
  }): CategoryNode => ({
    id: item.id,
    name: item.name,
    parentId: item.parentId ?? null,
    level: item.level ?? 0,
    isLeaf: item.isLeaf ?? !item.children?.length,
    appCount: Number(item.appCount ?? 0),
    children: item.children ? item.children.map((child): CategoryNode => ({
      id: child.id,
      name: child.name,
      parentId: child.parentId ?? item.id,
      level: (item.level ?? 0) + 1,
      isLeaf: child.isLeaf ?? !child.children?.length,
      appCount: Number(child.appCount ?? 0),
      children: child.children ? child.children.map((grandChild): CategoryNode => ({
        id: grandChild.id,
        name: grandChild.name,
        parentId: grandChild.parentId ?? child.id,
        level: (item.level ?? 0) + 2,
        isLeaf: true,
        appCount: Number(grandChild.appCount ?? 0),
      })) : []
    })) : []
  })) : mockCategories;

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: CategoryNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedCategoryId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <button
          onClick={() => onCategorySelect(node.id)}
          className={cn(
            "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors text-left",
            isSelected 
              ? "bg-blue-100 text-blue-700 font-medium" 
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          )}
          style={{ paddingLeft: `${depth * 0.75 + 0.75}rem` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="mr-1 p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
            </button>
          )}
          
          {!hasChildren && (
            <div className="w-5 h-5 mr-1 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          )}

          <span className="flex-1">{node.name}</span>
          
          {node.appCount !== undefined && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
              {node.appCount}
            </span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FolderTree className="h-5 w-5 mr-2" />
            应用分类
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5) as undefined[]].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-3">加载分类失败</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              重试
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map(category => renderNode(category))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

