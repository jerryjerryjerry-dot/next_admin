"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  LogOut
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
        {
          "bg-blue-100 text-blue-900 border-r-2 border-blue-500": isActive,
          "text-gray-600 hover:text-gray-900 hover:bg-gray-100": !isActive
        }
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
}

function Header() {
  const router = useRouter();
  
  // 获取用户信息
  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") ?? "用户" : "用户";
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") ?? "" : "";
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") ?? "user" : "user";

  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    
    // 重定向到登录页
    router.push("/auth");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧搜索 */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索功能、应用或数据..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* 右侧用户信息 */}
        <div className="flex items-center space-x-4">
          {/* 通知 */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* 用户菜单 */}
          <div className="relative group">
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500">{userRole === "admin" ? "管理员" : "用户"}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>

            {/* 下拉菜单 */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                {userEmail}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      name: "应用管理",
      href: "/app-management",
      icon: <Database className="h-5 w-5" />,
    },
    {
      name: "流量管理",
      href: "/traffic",
      icon: <Network className="h-5 w-5" />,
    },
    {
      name: "水印系统",
      href: "/watermark",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      name: "API管理",
      href: "/openapi",
      icon: <Key className="h-5 w-5" />,
    },
    {
      name: "系统设置",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            T3
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">管理系统</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.name}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbName = (path: string) => {
    const routes: Record<string, string> = {
      "/": "仪表盘",
      "/app-management": "应用管理",
      "/traffic": "流量管理",
      "/openapi": "OpenAPI管理",
      "/watermark": "水印系统",
      "/admin": "系统设置",
    };
    return routes[path] ?? "页面";
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span className="text-gray-900 font-medium">{getBreadcrumbName(pathname ?? "/")}</span>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区域 */}
        <div className="flex-1">
          {/* 头部 */}
          <Header />
          
          {/* 面包屑 */}
          <Breadcrumb />

          {/* 页面内容 */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
