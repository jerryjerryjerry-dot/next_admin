import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string().email("请输入有效的邮箱地址"),
      password: z.string().min(6, "密码至少需要6个字符"),
      name: z.string().min(2, "姓名至少需要2个字符"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, password, name } = input;

      // 检查用户是否已存在
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "该邮箱已被注册",
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);

      // 创建用户
      const user = await ctx.db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "user",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return user;
    }),

  // 登录
  login: publicProcedure
    .input(z.object({
      email: z.string().email("请输入有效的邮箱地址"),
      password: z.string().min(1, "请输入密码"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // 查找用户
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }

      // 验证密码
      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }

      // 返回用户信息（不包含密码）
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  // 发送重置密码验证码
  sendResetCode: publicProcedure
    .input(z.object({
      email: z.string().email("请输入有效的邮箱地址"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // 检查用户是否存在
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "该邮箱未注册",
        });
      }

      // 生成6位验证码
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 先删除该邮箱的旧验证码
      await ctx.db.passwordResetToken.deleteMany({
        where: { email },
      });

      // 创建新的验证码记录
      await ctx.db.passwordResetToken.create({
        data: {
          email,
          token: code,
          expires,
          used: false,
        },
      });

      // 在生产环境中，这里应该发送真实邮件
      // 现在模拟在控制台打印 - 服务器端日志
      console.log(`\n🔔 ===== 验证码发送 =====`);
      console.log(`🔑 重置密码验证码: ${code}`);
      console.log(`📧 发送到邮箱: ${email}`);
      console.log(`⏰ 有效期: 10分钟`);
      console.log(`🌐 环境: ${process.env.NODE_ENV}`);
      console.log(`📅 发送时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log(`🔔 ========================\n`);

      return {
        success: true,
        message: process.env.NODE_ENV === "development" 
          ? `验证码已生成: ${code} (开发模式显示)` 
          : "验证码已发送到您的邮箱",
        // 在实际生产中不应该返回验证码
        debugCode: process.env.NODE_ENV === "development" ? code : undefined,
        debugInfo: process.env.NODE_ENV === "development" ? {
          email,
          generatedAt: new Date().toISOString(),
          expiresIn: "10分钟"
        } : undefined,
      };
    }),

  // 验证重置码并重置密码
  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email("请输入有效的邮箱地址"),
      code: z.string().min(6, "验证码为6位"),
      newPassword: z.string().min(6, "密码至少需要6个字符"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, code, newPassword } = input;

      // 查找有效的验证码
      const resetToken = await ctx.db.passwordResetToken.findFirst({
        where: {
          email,
          token: code,
          used: false,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "验证码无效或已过期",
        });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // 更新用户密码
      await ctx.db.user.update({
        where: { email },
        data: { password: hashedPassword },
      });

      // 标记验证码为已使用
      await ctx.db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      // 清理该用户的所有重置码
      await ctx.db.passwordResetToken.deleteMany({
        where: {
          email,
          id: { not: resetToken.id },
        },
      });

      console.log(`✅ 密码重置成功，用户: ${email}`);

      return {
        success: true,
        message: "密码重置成功",
      };
    }),
});
