"use client";

import { useState } from "react";
import { Globe, Smartphone, Database, Shield, Monitor, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { StatusBadge } from "~/components/ui/status-badge";
import { ActionButtons } from "~/components/ui/action-buttons";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { TrafficRule } from "~/types/traffic";

interface TrafficTableProps {
  data: TrafficRule[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onEdit: (rule: TrafficRule) => void;
  onDelete: (id: string) => void;
  onDye: (id: string) => void;
  onTrace: (id: string) => void;
  onReport: (id: string) => void;
  loading?: boolean;
}

const getAppTypeIcon = (appType: string) => {
  switch (appType) {
    case 'web':
      return <Globe className="h-4 w-4" />;
    case 'app':
      return <Smartphone className="h-4 w-4" />;
    case 'api':
      return <Database className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  if (status === 'active' || status === 'inactive' || status === 'processing') {
    return <StatusBadge status={status} />;
  }
  return <Badge variant="outline">{status}</Badge>;
};

const getProtocolBadge = (protocol: string) => {
  const colors = {
    http: "bg-blue-100 text-blue-700 border-blue-200",
    https: "bg-green-100 text-green-700 border-green-200", 
    tcp: "bg-orange-100 text-orange-700 border-orange-200",
    udp: "bg-purple-100 text-purple-700 border-purple-200"
  };
  
  return (
    <Badge className={colors[protocol as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"}>
      {protocol.toUpperCase()}
    </Badge>
  );
};

type SortField = 'name' | 'priority' | 'createTime' | 'updateTime';
type SortDirection = 'asc' | 'desc';

export function TrafficTable({
  data,
  selectedIds,
  onSelectedChange,
  onEdit,
  onDelete,
  onDye,
  onTrace,
  onReport,
  loading = false
}: TrafficTableProps) {
  const [sortField, setSortField] = useState<SortField>('createTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange(data.map(rule => rule.id));
    } else {
      onSelectedChange([]);
    }
  };

  const handleSelectRule = (ruleId: string, checked: boolean) => {
    if (checked) {
      onSelectedChange([...selectedIds, ruleId]);
    } else {
      onSelectedChange(selectedIds.filter(id => id !== ruleId));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name': {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      }
      case 'priority': {
        comparison = a.priority - b.priority;
        break;
      }
      case 'createTime': {
        const timeA = new Date(a.createTime).getTime();
        const timeB = new Date(b.createTime).getTime();
        comparison = timeA - timeB;
        break;
      }
      case 'updateTime': {
        const timeA = new Date(a.updateTime).getTime();
        const timeB = new Date(b.updateTime).getTime();
        comparison = timeA - timeB;
        break;
      }
      default:
        return 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MM-dd HH:mm', { locale: zhCN });
    } catch {
      return '无效日期';
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? 
        <ChevronUp className="ml-1 h-3 w-3" /> : 
        <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">加载中...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <Monitor className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无流量规则</h3>
          <p className="text-gray-500">创建第一个流量染色规则开始管理流量</p>
        </div>
      </div>
    );
  }

  const isAllSelected = selectedIds.length === data.length && data.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                ref={(el: HTMLButtonElement | null) => {
                  if (el && 'indeterminate' in el) {
                    (el as HTMLInputElement).indeterminate = isIndeterminate;
                  }
                }}
              />
            </TableHead>
            <TableHead>
              <SortButton field="name">规则名称</SortButton>
            </TableHead>
            <TableHead>类型</TableHead>
            <TableHead>协议</TableHead>
            <TableHead>目标IP</TableHead>
            <TableHead>
              <SortButton field="priority">优先级</SortButton>
            </TableHead>
            <TableHead>状态</TableHead>
            <TableHead>
              <SortButton field="createTime">创建时间</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="updateTime">更新时间</SortButton>
            </TableHead>
            <TableHead className="w-40">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((rule) => (
            <TableRow key={rule.id} className="hover:bg-gray-50">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(rule.id)}
                  onCheckedChange={(checked) => handleSelectRule(rule.id, checked as boolean)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  {getAppTypeIcon(rule.appType)}
                  <span className="truncate max-w-[200px]" title={rule.name}>
                    {rule.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{rule.appType.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>
                {getProtocolBadge(rule.protocol)}
              </TableCell>
              <TableCell>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {rule.targetIp}
                </code>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={rule.priority >= 80 ? "border-red-300 text-red-700" : 
                            rule.priority >= 50 ? "border-yellow-300 text-yellow-700" : 
                            "border-green-300 text-green-700"}
                >
                  {rule.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(rule.status)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(rule.createTime)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(rule.updateTime)}
              </TableCell>
              <TableCell>
                <ActionButtons
                  onEdit={() => onEdit(rule)}
                  onDye={rule.status === 'active' ? () => onDye(rule.id) : undefined}
                  onTrace={() => onTrace(rule.id)}
                  onReport={() => onReport(rule.id)}
                  onDelete={() => onDelete(rule.id)}
                  disabled={false}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
