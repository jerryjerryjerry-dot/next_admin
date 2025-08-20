import { type ReactNode } from "react";

interface RequireRoleProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

interface RequireAnyRoleProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return <>{fallback}</>;
  }

  const userRole = localStorage.getItem("userRole") ?? "user";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (!isLoggedIn) {
    return <>{fallback}</>;
  }

  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  const hasPermission = requiredRoles.every(role => userRole === role);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

export function RequireAnyRole({ roles, children, fallback = null }: RequireAnyRoleProps) {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return <>{fallback}</>;
  }

  const userRole = localStorage.getItem("userRole") ?? "user";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (!isLoggedIn) {
    return <>{fallback}</>;
  }

  const hasAnyRole = roles.includes(userRole);
  
  return hasAnyRole ? <>{children}</> : <>{fallback}</>;
}

// 默认导出
export default RequireRole;
