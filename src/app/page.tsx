"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("userRole") ?? "user";
    
    if (isLoggedIn) {
      // 根据用户角色重定向到合适的页面
      if (userRole === "admin") {
        router.push("/app-management"); // admin用户进入应用管理
      } else {
        router.push("/traffic"); // user用户进入流量管理
      }
    } else {
      // 如果未登录，重定向到登录页
      router.push("/auth");
    }
  }, [router]);

  // 显示加载状态
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">正在重定向...</p>
      </div>
    </div>
  );
}
