// 扩展Prisma类型以支持我们添加的字段
import type { User as PrismaUser } from "@prisma/client";

// 扩展User类型包含我们的新字段
export interface ExtendedUser extends Omit<PrismaUser, 'password'> {
  password?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用于API返回的安全用户类型（不包含密码）
export interface SafeUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 用于认证的用户类型
export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}
