"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Settings, 
  Search, 
  Bell, 
  ChevronDown,
  Home,
  Network,
  Database,
  Shield,
  Key,
  LogOut,
  User,
  Lock
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { UserProfileModal } from "~/components/user-management/UserProfileModal";
import { ChangePasswordModal } from "~/components/user-management/ChangePasswordModal";
import { api } from "~/trpc/react";

interface LayoutProps {
  children: ReactNode;
}



function Header() {
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // 获取用户信息
  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") ?? "用户" : "用户";
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") ?? "" : "";
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") ?? "user" : "user";
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") ?? "" : "";

  // 获取用户详细信息
  const { data: userProfile } = api.userManagement.getUserById.useQuery(
    { id: userId },
    { enabled: !!userId && userId !== "" }
  );

  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    
    // 重定向到登录页
    router.push("/auth");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧搜索 */}
        <div className="flex items-center flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索功能、应用或数据..."
              className="pl-12 pr-4 py-3 bg-white border-gray-300 focus:bg-white focus:border-black focus:ring-2 focus:ring-gray-100 rounded-lg text-sm font-medium transition-all duration-300"
            />
          </div>
        </div>

        {/* 右侧用户信息 */}
        <div className="flex items-center space-x-4">
          {/* 通知 */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-black rounded-full text-xs text-white flex items-center justify-center font-bold">
              3
            </div>
          </Button>

          {/* 用户菜单 */}
          <div className="relative group">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500 font-medium">
                  {userRole === "admin" ? "系统管理员" : "普通用户"}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Button>

            {/* 下拉菜单 */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
              <div className="px-4 py-3 text-xs text-gray-500 border-b border-gray-100 bg-gray-50 mx-2 rounded-lg">
                <div className="font-semibold text-gray-700">{userEmail}</div>
                <div className="mt-1">在线状态：正常</div>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-all duration-200 mx-2 rounded-lg"
                >
                  <User className="h-4 w-4 mr-3" />
                  个人资料
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-all duration-200 mx-2 rounded-lg"
                >
                  <Lock className="h-4 w-4 mr-3" />
                  修改密码
                </button>
              </div>
              
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-all duration-200 mx-2 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  安全退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 模态框 */}
      <>
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={{
            id: userId || "unknown",
            email: userProfile?.email || userEmail,
            name: userProfile?.name || userName,
            phone: userProfile?.phone ?? undefined,
            department: userProfile?.department ?? undefined,
            position: userProfile?.position ?? undefined,
            description: userProfile?.description ?? undefined,
          }}
        />
        
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </>
    </header>
  );
}

function Sidebar() {
  const pathname = usePathname();
  
  // 获取用户角色
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") ?? "user" : "user";

  const allNavigation = [
    {
      name: "应用管理",
      href: "/app-management",
      icon: <Database className="h-5 w-5" />,
      description: "应用识别与管理",
      roles: ["admin"] // 只有admin可以访问
    },
    {
      name: "流量管理",
      href: "/traffic",
      icon: <Network className="h-5 w-5" />,
      description: "网络流量监控",
      roles: ["admin", "user"] // admin和user都可以访问
    },
    {
      name: "用户管理",
      href: "/user-management",
      icon: <User className="h-5 w-5" />,
      description: "用户账号权限管理",
      roles: ["admin"] // 只有admin可以访问
    },
    {
      name: "水印系统",
      href: "/watermark",
      icon: <Shield className="h-5 w-5" />,
      description: "数字水印保护",
      roles: ["admin"] // 只有admin可以访问
    },
    {
      name: "API管理",
      href: "/openapi",
      icon: <Key className="h-5 w-5" />,
      description: "接口密钥管理",
      roles: ["admin"] // 只有admin可以访问
    },
  ];

  // 根据用户角色过滤导航项
  const navigation = allNavigation.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 h-full bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="ml-3">
            <div className="text-xl font-bold text-gray-800">
              安全流量管理平台
            </div>
            <div className="text-xs text-gray-500 mt-1">Security Traffic Platform</div>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 relative",
              {
                "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md": pathname === item.href,
                "text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm": pathname !== item.href
              }
            )}
          >
            {/* 活跃状态指示 */}
            {pathname === item.href && (
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-gray-600 to-gray-800 rounded-r-full" />
            )}
            
            <span className={cn(
              "mr-3 transition-transform duration-300",
              pathname === item.href ? "scale-110" : "group-hover:scale-105"
            )}>
              {item.icon}
            </span>
            
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className={cn(
                "text-xs transition-colors",
                pathname === item.href 
                  ? "text-gray-300" 
                  : "text-gray-500 group-hover:text-gray-600"
              )}>
                {item.description}
              </div>
            </div>

            {/* 悬停光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Link>
        ))}
      </nav>

      {/* 底部装饰 */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded-lg p-3 border border-gray-300/50">
          <div className="text-xs text-gray-500 text-center mt-1">
            © 2025 安全流量管理平台
          </div>
        </div>
      </div>
    </aside>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbName = (path: string) => {
    const routes: Record<string, { name: string; desc: string }> = {
      "/": { name: "仪表盘", desc: "系统概览与监控" },
      "/app-management": { name: "应用管理", desc: "应用识别与分类管理" },
      "/traffic": { name: "流量管理", desc: "网络流量监控与分析" },
      "/user-management": { name: "用户管理", desc: "用户账号权限管理" },
      "/openapi": { name: "API管理", desc: "接口密钥与监控中心" },
      "/watermark": { name: "水印系统", desc: "数字水印保护服务" },
      "/admin": { name: "系统设置", desc: "系统配置与权限管理" },
    };
    return routes[path] ?? { name: "页面", desc: "系统页面" };
  };

  const currentPage = getBreadcrumbName(pathname ?? "/");

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Home className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-400 font-medium">/</span>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-base">{currentPage.name}</span>
              <span className="text-xs text-gray-500">{currentPage.desc}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span>系统运行正常</span>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        {/* 固定侧边栏 - 防止滚动 */}
        <div className="fixed top-0 left-0 h-full z-30">
          <Sidebar />
        </div>

        {/* 主内容区域 - 左侧预留侧边栏空间 */}
        <div className="flex-1 ml-64 flex flex-col h-full">
          {/* 固定头部 */}
          <div className="fixed top-0 right-0 z-20 bg-white shadow-sm" style={{ width: 'calc(100% - 16rem)' }}>
            <Header />
            <Breadcrumb />
          </div>

          {/* 可滚动主内容 - 顶部预留头部空间 */}
          <main className="flex-1 overflow-y-auto pt-32 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
