"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

// 不需要认证的页面路径
const PUBLIC_PATHS = [
  "/auth",
  "/api/auth",
];

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("userRole") ?? "user";
    
    // 获取当前路径
    const currentPath = window.location.pathname;

    // 检查是否是公开页面
    const isPublicPath = PUBLIC_PATHS.some(path => 
      currentPath.startsWith(path)
    );

    // 如果是公开页面，直接显示
    if (isPublicPath) return;

    // 如果用户未登录且不在公开页面，重定向到登录页
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    // 如果用户已登录但在根路径，重定向到首页
    if (isLoggedIn && currentPath === "/") {
      router.push("/");
      return;
    }

    // 检查角色权限
    if (isLoggedIn && requiredRole && userRole !== requiredRole) {
      // 权限不足，可以重定向到首页或显示错误
      router.push("/");
      return;
    }
  }, [router, requiredRole]);

  // 检查登录状态
  const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") ?? "user" : "user";
  
  // 获取当前路径
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  // 检查是否是公开页面
  const isPublicPath = PUBLIC_PATHS.some(path => 
    currentPath.startsWith(path)
  );

  // 如果是公开页面，显示内容
  if (isPublicPath) {
    return <>{children}</>;
  }

  // 如果未登录，显示加载状态
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">重定向到登录页...</p>
        </div>
      </div>
    );
  }

  // 检查角色权限
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">权限不足！</strong>
            <span className="block sm:inline"> 您没有访问此页面的权限。</span>
          </div>
        </div>
      </div>
    );
  }

  // 如果用户已登录且权限满足，显示内容
  return <>{children}</>;
}
