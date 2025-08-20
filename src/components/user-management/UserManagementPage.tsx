"use client";

import { useState } from "react";
import { 
  UserPlus, 
  Search, 
  Filter, 
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { UserStatsGrid } from "./UserStatsGrid";
import { UserTable } from "./UserTable";
import { CreateUserModal } from "./CreateUserModal";
import { UserProfileModal } from "./UserProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { ExportModal } from "./ExportModal";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { type UserProfile } from "~/types/user-management";

export function UserManagementPage() {
  const { toast } = useToast();
  
  // 状态管理
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // API 查询
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = api.userManagement.getUsers.useQuery({
    page: currentPage,
    limit: 20,
    search: searchKeyword,
    role: roleFilter,
    status: statusFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { 
    data: userStats, 
    isLoading: statsLoading,
    refetch: refetchStats
  } = api.userManagement.getUserStats.useQuery();

  // 删除用户
  const deleteUserMutation = api.userManagement.deleteUser.useMutation({
    onSuccess: () => {
      toast({
        title: "🗑️ 删除成功",
        description: "用户已被删除",

      });
      refetchUsers();
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "❌ 删除失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 更新用户状态
  const updateUserMutation = api.userManagement.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ 更新成功",
        description: "用户状态已更新",

      });
      refetchUsers();
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "❌ 更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 重置密码
  const resetPasswordMutation = api.userManagement.resetUserPassword.useMutation({
    onSuccess: () => {
      toast({
        title: "🔑 密码重置成功",
        description: "用户密码已重置",

      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ 重置失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1);
    refetchUsers();
  };

  // 处理刷新
  const handleRefresh = () => {
    refetchUsers();
    refetchStats();
  };

  // 处理创建成功
  const handleCreateSuccess = () => {
    refetchUsers();
    refetchStats();
  };

  // 处理编辑用户
  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // 处理删除用户
  const handleDeleteUser = (user: UserProfile) => {
    if (confirm(`确定要删除用户 "${user.name}" 吗？此操作不可恢复。`)) {
      deleteUserMutation.mutate({ id: user.id });
    }
  };

  // 处理重置密码
  const handleResetPassword = (user: UserProfile) => {
    const newPassword = prompt(`请输入用户 "${user.name}" 的新密码（至少6个字符）：`);
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({
        userId: user.id,
        newPassword,
        confirmPassword: newPassword,
      });
    } else if (newPassword) {
      toast({
        title: "⚠️ 密码太短",
        description: "密码至少需要6个字符",
        variant: "destructive",
      });
    }
  };

  // 处理状态切换
  const handleToggleStatus = (user: UserProfile, status: "active" | "inactive" | "suspended") => {
    const statusText = {
      active: "激活",
      inactive: "停用", 
      suspended: "暂停"
    }[status];
    
    if (confirm(`确定要${statusText}用户 "${user.name}" 吗？`)) {
      updateUserMutation.mutate({
        id: user.id,
        status,
      });
    }
  };

  // 处理查看详情
  const handleViewDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 操作按钮栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={usersLoading || statsLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(usersLoading || statsLoading) ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white hover:bg-gray-800 border-black"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            新建用户
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <UserStatsGrid 
        stats={userStats || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          suspendedUsers: 0,
          adminUsers: 0,
          regularUsers: 0,
          recentLogins: 0,
          lockedUsers: 0,
        }}
        isLoading={statsLoading}
      />

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* 搜索区域 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="搜索用户名、邮箱、姓名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-64 border-gray-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="outline" 
                onClick={handleSearch} 
                disabled={usersLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
            </div>
          </div>

          {/* 筛选区域 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">筛选:</span>
            </div>
            
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 用户表格 */}
      <UserTable
        users={usersData?.users || []}
        isLoading={usersLoading}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />

      {/* 分页 */}
      {usersData && usersData.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="border-gray-300"
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {currentPage} 页，共 {usersData.totalPages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(usersData.totalPages, prev + 1))}
            disabled={currentPage === usersData.totalPages}
            className="border-gray-300"
          >
            下一页
          </Button>
        </div>
      )}

      {/* 模态框 */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedUser && (
        <>
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => {
              setShowProfileModal(false);
              setSelectedUser(null);
            }}
            userProfile={{
              id: selectedUser.id,
              email: selectedUser.email,
              name: selectedUser.name,
              phone: selectedUser.phone,
              department: selectedUser.department,
              position: selectedUser.position,
              description: selectedUser.description,
            }}
          />
        </>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={usersData?.users || []}
        stats={userStats}
      />
    </div>
  );
}
