"use client";

import { Database, CheckCircle, Target, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/utils/api";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
    label: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

function StatsCard({ title, value, change, icon: Icon, loading }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-gray-400">--</span>
            </div>
          ) : (
            value
          )}
        </div>
        {change && !loading && (
          <p className="text-xs text-muted-foreground">
            <span
              className={`${
                change.type === "increase"
                  ? "text-green-600"
                  : change.type === "decrease"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {change.value}
            </span>{" "}
            {change.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsGrid() {
  const { data: stats, isLoading, error } = api.traffic.getStats.useQuery(
    undefined,
    {
      refetchInterval: 30000, // 30秒刷新一次
      retry: 3,
    }
  );

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-gray-500">统计数据加载失败</p>
              <p className="text-sm text-gray-400 mt-1">
                {error.message || "请稍后重试"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="总规则数"
        value={stats?.totalRules ?? "--"}
        change={{
          value: "+12",
          type: "increase",
          label: "今日新增"
        }}
        icon={Database}
        loading={isLoading}
      />
      
      <StatsCard
        title="活跃规则"
        value={stats?.activeRules ?? "--"}
        change={{
          value: stats ? `${Math.round((stats.activeRules / stats.totalRules) * 100)}%` : "--",
          type: "neutral",
          label: "活跃率"
        }}
        icon={CheckCircle}
        loading={isLoading}
      />
      
      <StatsCard
        title="染色执行"
        value={stats?.todayExecutions.toLocaleString() ?? "--"}
        change={{
          value: "+156",
          type: "increase",
          label: "今日执行"
        }}
        icon={Target}
        loading={isLoading}
      />
      
      <StatsCard
        title="成功率"
        value={stats ? `${stats.successRate.toFixed(1)}%` : "--"}
        change={{
          value: "+0.3%",
          type: "increase",
          label: "较昨日"
        }}
        icon={TrendingUp}
        loading={isLoading}
      />
    </div>
  );
}
