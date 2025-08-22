"use client";

import { Database, CheckCircle, Target, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

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
      refetchInterval: (data) => {
        // 如果平均延迟 < 30ms，则1秒刷新一次（实时更新）
        // 否则2小时刷新一次（增量更新）
        const avgResponseTime = data?.avgResponseTime ?? 100;
        return avgResponseTime < 30 ? 1000 : 2 * 60 * 60 * 1000;
      },
      retry: 3,
      staleTime: (data) => {
        const avgResponseTime = data?.avgResponseTime ?? 100;
        return avgResponseTime < 30 ? 0 : 2 * 60 * 60 * 1000;
      },
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
        title="月度总流量"
        value={stats?.totalTraffic ? `${(stats.totalTraffic / 1000000000).toFixed(2)}GB` : "--"}
        change={{
          value: stats?.totalTraffic ? `+${Math.floor((stats.totalTraffic - 5000000000) / 10000000) / 100}GB` : "+0",
          type: "increase",
          label: "累积增长"
        }}
        icon={Target}
        loading={isLoading}
      />
      
      <StatsCard
        title="染色流量"
        value={stats?.dyedTraffic ? `${(stats.dyedTraffic / 1000000000).toFixed(2)}GB` : "--"}
        change={{
          value: stats?.dyedTraffic && stats?.totalTraffic ? `${((stats.dyedTraffic / stats.totalTraffic) * 100).toFixed(1)}%` : "--",
          type: "neutral",
          label: "染色率"
        }}
        icon={TrendingUp}
        loading={isLoading}
      />
      
      <StatsCard
        title="平均延迟"
        value={stats?.avgResponseTime ? `${stats.avgResponseTime}ms` : "--"}
        change={{
          value: stats?.avgResponseTime ? (stats.avgResponseTime < 75 ? "良好" : "一般") : "--",
          type: stats?.avgResponseTime && stats.avgResponseTime < 75 ? "increase" : "neutral",
          label: "响应状态"
        }}
        icon={CheckCircle}
        loading={isLoading}
      />
    </div>
  );
}
