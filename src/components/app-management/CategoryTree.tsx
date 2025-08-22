"use client";

import React, { useState } from "react";
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

  // 默认的"全部分类"节点
  const defaultAllCategory: CategoryNode = {
    id: "all",
    name: "全部分类",
    parentId: null,
    level: 0,
    isLeaf: false,
    appCount: 0,
    children: [],
  };

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

  // 调试日志
  React.useEffect(() => {
    if (apiData) {
      console.log('✅ CategoryTree API调用成功:', apiData);
    }
    if (error) {
      console.error('🔥 CategoryTree API调用失败:', error);
    }
  }, [apiData, error]);

  // 转换 API 数据到 CategoryNode 格式，构建完整的分类树
  const categories: CategoryNode[] = React.useMemo(() => {
    if (!apiData || apiData.length === 0) {
      return [defaultAllCategory];
    }

    const apiCategories = apiData.map((item: {
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
    }));

    // 计算总应用数量并构建完整树结构
    const totalAppCount = apiCategories.reduce((sum, cat) => sum + (cat.appCount ?? 0), 0);
    return [{
      ...defaultAllCategory,
      appCount: totalAppCount,
      children: apiCategories
    }];
  }, [apiData, defaultAllCategory]);

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCategorySelect(node.id);
      }
      if (hasChildren && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if ((e.key === 'ArrowRight' && !isExpanded) || (e.key === 'ArrowLeft' && isExpanded)) {
          toggleExpanded(node.id);
        }
      }
    };

    const handleExpanderKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleExpanded(node.id);
      }
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors cursor-pointer",
            isSelected 
              ? "bg-blue-100 text-blue-700 font-medium" 
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          )}
          style={{ paddingLeft: `${depth * 0.75 + 0.75}rem` }}
          onClick={() => onCategorySelect(node.id)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-pressed={isSelected}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              onKeyDown={handleExpanderKeyDown}
              className="mr-1 p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={isExpanded ? "收起分类" : "展开分类"}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
            </span>
          )}
          
          {!hasChildren && (
            <div className="w-5 h-5 mr-1 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          )}

          <span className="flex-1 truncate" title={node.name}>{node.name}</span>
          
          {node.appCount !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full flex-shrink-0">
              {node.appCount}
            </span>
          )}
        </div>

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

