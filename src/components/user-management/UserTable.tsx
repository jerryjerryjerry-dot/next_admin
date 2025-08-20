"use client";

import { useState } from "react";
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Key,
  Eye,
  Calendar,
  MapPin
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "~/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type UserProfile } from "~/types/user-management";

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onToggleStatus: (user: UserProfile, status: "active" | "inactive" | "suspended") => void;
  onViewDetails: (user: UserProfile) => void;
}

export function UserTable({
  users,
  isLoading,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleStatus,
  onViewDetails
}: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">活跃</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">停用</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 border-red-200">暂停</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">未知</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-black text-white border-black">管理员</Badge>;
      case "user":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">普通用户</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">未知</Badge>;
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-48 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户数据</h3>
          <p className="text-gray-500">没有找到符合条件的用户</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">用户信息</TableHead>
            <TableHead className="font-semibold text-gray-700">角色</TableHead>
            <TableHead className="font-semibold text-gray-700">状态</TableHead>
            <TableHead className="font-semibold text-gray-700">最后登录</TableHead>
            <TableHead className="font-semibold text-gray-700">创建时间</TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow 
              key={user.id} 
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getRoleBadge(user.role)}
              </TableCell>
              <TableCell>
                {getStatusBadge(user.status)}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(user.lastLoginAt)}
                  </div>
                  {user.lastLoginIp && (
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {user.lastLoginIp}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewDetails(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑用户
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      <Key className="mr-2 h-4 w-4" />
                      重置密码
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {user.status === "active" ? (
                      <>
                        <DropdownMenuItem 
                          onClick={() => onToggleStatus(user, "inactive")}
                          className="text-orange-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          停用账号
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onToggleStatus(user, "suspended")}
                          className="text-red-600"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          暂停账号
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus(user, "active")}
                        className="text-green-600"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        激活账号
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => onDelete(user)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除用户
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

