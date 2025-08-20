// 🐼 用户管理相关类型定义 - 熊猫科技风格

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  description?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
  phone?: string;
  department?: string;
  position?: string;
  description?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  description?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive" | "suspended";
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserFormData {
  username: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  description: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
}

export interface ProfileFormData {
  email: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  description: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentLogins: number;
  lockedUsers: number;
}