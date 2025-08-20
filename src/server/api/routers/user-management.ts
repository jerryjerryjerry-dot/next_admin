import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { type UserProfile, type UserStats } from "~/types/user-management";

// 移除认证要求 - 所有API现在都是公开的
// const requireAdmin = (userRole: string) => {
//   if (userRole !== "admin") {
//     throw new TRPCError({
//       code: "FORBIDDEN",
//       message: "只有管理员可以执行此操作",
//     });
//   }
// };

// Zod 验证模式
const createUserSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符").max(50, "用户名最多50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  name: z.string().min(1, "姓名不能为空").max(100, "姓名最多100个字符"),
  password: z.string().min(6, "密码至少6个字符").max(128, "密码最多128个字符"),
  role: z.enum(["admin", "user"]).default("user"),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  description: z.string().optional(),
});

const updateUserSchema = z.object({
  id: z.string(),
  email: z.string().email("请输入有效的邮箱地址").optional(),
  name: z.string().min(1, "姓名不能为空").max(100, "姓名最多100个字符").optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  description: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

const updateProfileSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址").optional(),
  name: z.string().min(1, "姓名不能为空").max(100, "姓名最多100个字符").optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  description: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "新密码至少6个字符").max(128, "新密码最多128个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(6, "新密码至少6个字符").max(128, "新密码最多128个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

const userQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["admin", "user", "all"]).default("all"),
  status: z.enum(["active", "inactive", "suspended", "all"]).default("all"),
  sortBy: z.enum(["createdAt", "lastLoginAt", "name", "username"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const userManagementRouter = createTRPCRouter({
  // 获取用户列表（无需认证）
  getUsers: publicProcedure
    .input(userQuerySchema)
    .query(async ({ ctx, input }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      const { page, limit, search, role, status, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const where: any = {};

      if (search) {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role !== "all") {
        where.role = role;
      }

      if (status !== "all") {
        where.status = status;
      }

      // 查询用户列表
      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
            status: true,
            phone: true,
            avatar: true,
            department: true,
            position: true,
            description: true,
            lastLoginAt: true,
            lastLoginIp: true,
            loginAttempts: true,
            lockedUntil: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users as UserProfile[],
        total,
        page,
        limit,
        totalPages,
      };
    }),

  // 获取用户统计数据（无需认证）
  getUserStats: publicProcedure
    .query(async ({ ctx }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        adminUsers,
        regularUsers,
        recentLogins,
        lockedUsers,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.user.count({ where: { status: "active" } }),
        ctx.db.user.count({ where: { status: "inactive" } }),
        ctx.db.user.count({ where: { status: "suspended" } }),
        ctx.db.user.count({ where: { role: "admin" } }),
        ctx.db.user.count({ where: { role: "user" } }),
        ctx.db.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
            },
          },
        }),
        ctx.db.user.count({
          where: {
            lockedUntil: {
              gt: new Date(),
            },
          },
        }),
      ]);

      const stats: UserStats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        adminUsers,
        regularUsers,
        recentLogins,
        lockedUsers,
      };

      return stats;
    }),

  // 获取单个用户详情（无需认证）
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 移除认证检查 - 任何人都可以查看用户信息
      // if (ctx.session.user.role !== "admin" && ctx.session.user.id !== input.id) {
      //   throw new TRPCError({
      //     code: "FORBIDDEN",
      //     message: "您只能查看自己的信息",
      //   });
      // }

      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          avatar: true,
          department: true,
          position: true,
          description: true,
          lastLoginAt: true,
          lastLoginIp: true,
          loginAttempts: true,
          lockedUntil: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      return user as UserProfile;
    }),

  // 创建用户（无需认证）
  createUser: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      // 检查用户名和邮箱是否已存在
      const existingUser = await ctx.db.user.findFirst({
        where: {
          OR: [
            { username: input.username },
            { email: input.email },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === input.username) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "用户名已存在",
          });
        }
        if (existingUser.email === input.email) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "邮箱已存在",
          });
        }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // 创建用户
      const newUser = await ctx.db.user.create({
        data: {
          username: input.username,
          email: input.email,
          name: input.name,
          password: hashedPassword,
          role: input.role,
          phone: input.phone,
          department: input.department,
          position: input.position,
          description: input.description,
          createdById: "system", // 使用系统用户ID
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return newUser;
    }),

  // 更新用户信息（无需认证）
  updateUser: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 移除认证检查 - 任何人都可以更新用户信息
      // if (ctx.session.user.role !== "admin" && ctx.session.user.id !== id) {
      //   throw new TRPCError({
      //     code: "FORBIDDEN",
      //     message: "您只能修改自己的信息",
      //   });
      // }

      // 检查用户是否存在
      const existingUser = await ctx.db.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 移除角色检查 - 任何人都可以修改角色和状态
      // if (ctx.session.user.role !== "admin") {
      //   delete updateData.role;
      //   delete updateData.status;
      // }

      // 检查邮箱是否已被其他用户使用
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await ctx.db.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: id },
          },
        });

        if (emailExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "邮箱已被其他用户使用",
          });
        }
      }

      // 更新用户信息
      const updatedUser = await ctx.db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          avatar: true,
          department: true,
          position: true,
          description: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),

  // 修改密码（无需认证）
  changePassword: publicProcedure
    .input(z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6, "新密码至少6个字符").max(128, "新密码最多128个字符"),
      confirmPassword: z.string(),
      userId: z.string()
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: "两次输入的密码不一致",
      path: ["confirmPassword"],
    }))
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword, userId } = input;

      // 获取用户当前密码
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 验证当前密码（如果提供了）
      if (currentPassword) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "当前密码错误",
          });
        }
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // 更新密码
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          loginAttempts: 0, // 重置登录失败次数
          lockedUntil: null, // 解除锁定
        },
      });

      return { success: true, message: "密码修改成功" };
    }),

  // 重置用户密码（无需认证）
  resetUserPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      const { userId, newPassword } = input;

      // 检查目标用户是否存在
      const targetUser = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "目标用户不存在",
        });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // 更新密码
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          loginAttempts: 0, // 重置登录失败次数
          lockedUntil: null, // 解除锁定
        },
      });

      return { success: true, message: "密码重置成功" };
    }),

  // 删除用户（无需认证）
  deleteUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      // 移除自删除检查
      // if (ctx.session.user.id === input.id) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "不能删除自己的账号",
      //   });
      // }

      // 检查用户是否存在
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 删除用户（级联删除相关数据）
      await ctx.db.user.delete({
        where: { id: input.id },
      });

      return { success: true, message: "用户删除成功" };
    }),

  // 批量操作用户（无需认证）
  batchUpdateUsers: publicProcedure
    .input(z.object({
      userIds: z.array(z.string()).min(1, "至少选择一个用户"),
      operation: z.enum(["activate", "deactivate", "suspend", "delete"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // 移除认证检查
      // requireAdmin(ctx.session.user.role);

      const { userIds, operation } = input;

      // 移除自操作检查
      // if (userIds.includes(ctx.session.user.id)) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "不能对自己的账号进行批量操作",
      //   });
      // }

      let result;

      switch (operation) {
        case "activate":
          result = await ctx.db.user.updateMany({
            where: { id: { in: userIds } },
            data: { status: "active" },
          });
          break;
        case "deactivate":
          result = await ctx.db.user.updateMany({
            where: { id: { in: userIds } },
            data: { status: "inactive" },
          });
          break;
        case "suspend":
          result = await ctx.db.user.updateMany({
            where: { id: { in: userIds } },
            data: { status: "suspended" },
          });
          break;
        case "delete":
          result = await ctx.db.user.deleteMany({
            where: { id: { in: userIds } },
          });
          break;
      }

      return {
        success: true,
        message: `成功${operation === "delete" ? "删除" : "更新"}了 ${result.count} 个用户`,
        count: result.count,
      };
    }),

  // 获取用户登录日志（无需认证）
  getUserLoginLogs: publicProcedure
    .input(z.object({
      userId: z.string(), // 必须提供用户ID
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, page, limit } = input;
      const skip = (page - 1) * limit;

      // 移除认证检查 - 任何人都可以查看任何用户的登录日志
      const targetUserId = userId;
      // if (ctx.session.user.role !== "admin" && ctx.session.user.id !== targetUserId) {
      //   throw new TRPCError({
      //     code: "FORBIDDEN",
      //     message: "您只能查看自己的登录日志",
      //   });
      // }

      const [logs, total] = await Promise.all([
        ctx.db.userLoginLog.findMany({
          where: { userId: targetUserId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.userLoginLog.count({
          where: { userId: targetUserId },
        }),
      ]);

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),
});
