"use client";

import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type UserStats } from "~/types/user-management";

interface UserStatsGridProps {
  stats: UserStats;
  isLoading: boolean;
}

export function UserStatsGrid({ stats, isLoading }: UserStatsGridProps) {
  const statsCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      icon: Users,
      color: "text-black",
      bgColor: "bg-gray-100",
      description: "系统中的所有用户"
    },
    {
      title: "活跃用户",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "当前活跃的用户"
    },
    {
      title: "管理员",
      value: stats.adminUsers,
      icon: Shield,
      color: "text-black",
      bgColor: "bg-gray-100",
      description: "具有管理权限的用户"
    },
    {
      title: "最近登录",
      value: stats.recentLogins,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "24小时内登录的用户"
    },
    {
      title: "停用用户",
      value: stats.inactiveUsers,
      icon: UserX,
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      description: "已停用的用户账号"
    },
    {
      title: "锁定用户",
      value: stats.lockedUsers,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "因安全原因被锁定"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {card.title}
                <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-black">
                  {card.value.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

