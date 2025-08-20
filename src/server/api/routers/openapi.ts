import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  createApiKeySchema,
  updateApiKeySchema,
  getApiCallsSchema,
  batchOperationSchema,
  testApiRequestSchema,
  API_PERMISSION_TEMPLATES,
  type CreateApiKeyRequest,
  type UpdateApiKeyRequest,
  type GetApiCallsRequest,
  type BatchOperationRequest,
  type TestApiRequest,

} from "~/types/openapi";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// 简化的数据库上下文类型


// 获取默认用户ID的辅助函数（移除认证）
import type { db } from "~/server/db";

async function getDefaultUserId(ctx: { db: typeof db }): Promise<string> {
  // 获取或创建默认用户
  let user = await ctx.db.user.findFirst();
  user ??= await ctx.db.user.create({
      data: { 
        name: "Default User",
        email: "default@example.com",
        role: "admin",
      },
    });
  return user.id;
}

// 工具函数：生成访问密钥对
function generateAccessKeyPair() {
  const accessKeyId = `AK${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  const accessKeySecret = crypto.randomBytes(32).toString('hex');
  return { accessKeyId, accessKeySecret };
}

// 工具函数：加密密钥
function encryptSecret(secret: string) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY ?? 'default-secret-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// 工具函数：解密密钥（保留但标记未使用以避免警告）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decryptSecret(encryptedSecret: string) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY ?? 'default-secret-key', 'salt', 32);
    const [ivHex, encrypted] = encryptedSecret.split(':');
    if (!ivHex || !encrypted) return encryptedSecret;
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedSecret; // 解密失败返回原文
  }
}

export const openApiRouter = createTRPCRouter({
  // ================== API分类管理 ==================
  categories: {
    // 获取所有分类
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await ctx.db.apiCategory.findMany({
        include: {
          endpoints: {
            select: {
              id: true,
              name: true,
              endpoint: true,
              method: true,
              status: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    }),

    // 获取单个分类详情
    getById: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        const category = await ctx.db.apiCategory.findUnique({
          where: { id: input },
          include: {
            endpoints: true,
          },
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "分类不存在",
          });
        }

        return category;
      }),
  },

  // ================== API端点管理 ==================
  endpoints: {
    // 获取所有端点
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await ctx.db.apiEndpoint.findMany({
        include: {
          category: true,
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { endpoint: 'asc' },
        ],
      });
    }),

    // 按分类获取端点
    getByCategory: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        return await ctx.db.apiEndpoint.findMany({
          where: { categoryId: input },
          include: {
            category: true,
          },
          orderBy: { endpoint: 'asc' },
        });
      }),

    // 获取单个端点详情
    getById: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        const endpoint = await ctx.db.apiEndpoint.findUnique({
          where: { id: input },
          include: {
            category: true,
          },
        });

        if (!endpoint) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "端点不存在",
          });
        }

        return endpoint;
      }),
  },

  // ================== API密钥管理 ==================
  keys: {
    // 获取所有密钥
    getAll: publicProcedure.query(async ({ ctx }) => {
      // 获取所有密钥，不限制用户（用于演示和测试）
      const keys = await ctx.db.apiKey.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 解析权限并遮蔽密钥
      return keys.map((key) => ({
        ...key,
        accessKeySecret: '****' + key.accessKeySecret.slice(-4),
        permissions: key.permissions,
        permissionLabels: JSON.parse(key.permissions) as string[],
        quotaUsagePercent: key.quotaLimit ? Math.round((key.quotaUsed / key.quotaLimit) * 100) : 0,
        isExpired: key.expiresAt ? new Date() > key.expiresAt : false,
        // 包含用户信息
        userName: key.user.name,
        userEmail: key.user.email,
      }));
    }),

    // 创建新密钥
    create: publicProcedure
      .input(createApiKeySchema)
      .mutation(async ({ ctx, input }: { ctx: { db: typeof db }; input: CreateApiKeyRequest }) => {
        const userId = await getDefaultUserId(ctx);

        const { accessKeyId, accessKeySecret } = generateAccessKeyPair();
        const encryptedSecret = encryptSecret(accessKeySecret);

        const apiKey = await ctx.db.apiKey.create({
          data: {
            keyName: input.keyName,
            purpose: input.purpose,
            accessKeyId,
            accessKeySecret: encryptedSecret,
            permissions: JSON.stringify(input.permissions),
            quotaLimit: input.quotaLimit,
            expiresAt: input.expiresAt,
            userId,
          },
        });

        return {
          ...apiKey,
          accessKeySecret, // 返回未加密的密钥给前端显示（仅此一次）
        };
      }),

    // 更新密钥
    update: publicProcedure
      .input(updateApiKeySchema)
      .mutation(async ({ ctx, input }: { ctx: { db: typeof db }; input: UpdateApiKeyRequest }) => {
        // 检查密钥是否存在
        const existingKey = await ctx.db.apiKey.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!existingKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "密钥不存在",
          });
        }

        const { id, ...updateData } = input;
        
        return await ctx.db.apiKey.update({
          where: { id },
          data: {
            ...updateData,
            permissions: updateData.permissions ? JSON.stringify(updateData.permissions) : undefined,
          },
        });
      }),

    // 删除密钥
    delete: publicProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        // 直接删除，不限制用户（用于演示和测试）
        const existingKey = await ctx.db.apiKey.findFirst({
          where: { id: input },
        });

        if (!existingKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "密钥不存在",
          });
        }

        await ctx.db.apiKey.delete({
          where: { id: input },
        });

        return { success: true };
      }),

    // 切换密钥状态
    toggleStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingKey = await ctx.db.apiKey.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!existingKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "密钥不存在",
          });
        }

        return await ctx.db.apiKey.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      }),

    // 批量操作
    batchOperation: publicProcedure
      .input(batchOperationSchema)
      .mutation(async ({ ctx, input }: { ctx: { db: typeof db }; input: BatchOperationRequest }) => {
        // 验证所有密钥都存在
        const keys = await ctx.db.apiKey.findMany({
          where: {
            id: { in: input.ids },
          },
        });

        if (keys.length !== input.ids.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "部分密钥不存在",
          });
        }

        if (input.operation === "delete") {
          await ctx.db.apiKey.deleteMany({
            where: {
              id: { in: input.ids },
            },
          });
        } else if (input.operation === "activate" || input.operation === "deactivate") {
          const status = input.operation === "activate" ? "active" : "inactive";
          await ctx.db.apiKey.updateMany({
            where: {
              id: { in: input.ids },
            },
            data: { status },
          });
        }

        return { success: true, affectedCount: keys.length };
      }),

    // 重新生成密钥
    regenerate: publicProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        const existingKey = await ctx.db.apiKey.findFirst({
          where: {
            id: input,
          },
        });

        if (!existingKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "密钥不存在",
          });
        }

        const { accessKeyId, accessKeySecret } = generateAccessKeyPair();
        const encryptedSecret = encryptSecret(accessKeySecret);

        const updatedKey = await ctx.db.apiKey.update({
          where: { id: input },
          data: {
            accessKeyId,
            accessKeySecret: encryptedSecret,
          },
        });

        return {
          ...updatedKey,
          accessKeySecret, // 返回未加密的密钥
        };
      }),
  },

  // ================== 调用监控 ==================
  monitoring: {
    // 获取调用日志
    getCalls: publicProcedure
      .input(getApiCallsSchema)
      .query(async ({ ctx, input }: { ctx: { db: typeof db }; input: GetApiCallsRequest }) => {
        const { limit = 20, offset = 0, apiKeyId, endpointId, success, timeRange } = input;

        const whereClause: Record<string, unknown> = {};

        if (apiKeyId) {
          whereClause.apiKeyId = apiKeyId;
        }

        if (endpointId) {
          whereClause.endpointId = endpointId;
        }

        if (success !== undefined) {
          whereClause.success = success;
        }

        if (timeRange) {
          const now = new Date();
          let startDate: Date;

          switch (timeRange) {
            case '1h':
              startDate = new Date(now.getTime() - 60 * 60 * 1000);
              break;
            case '24h':
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case '7d':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30d':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }

          whereClause.createdAt = {
            gte: startDate,
          };
        }

        const [calls, total] = await Promise.all([
          ctx.db.apiCall.findMany({
            where: whereClause as never,
            include: {
              apiKey: {
                select: {
                  keyName: true,
                },
              },
              apiEndpoint: {
                select: {
                  name: true,
                  endpoint: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          ctx.db.apiCall.count({ where: whereClause as never }),
        ]);

        return {
          calls,
          total,
          hasMore: offset + limit < total,
        };
      }),

    // 获取统计数据
    getStats: publicProcedure
      .input(z.object({
        timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
      }))
      .query(async ({ ctx, input }) => {
        const now = new Date();
        let startDate: Date;

        switch (input.timeRange) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        const whereClause = {
          createdAt: {
            gte: startDate,
          },
        };

        const [
          totalCalls,
          successfulCalls,
          avgResponseTime,
          topEndpoints,
          callsOverTime,
        ] = await Promise.all([
          // 总调用次数
          ctx.db.apiCall.count({ where: whereClause }),
          
          // 成功调用次数
          ctx.db.apiCall.count({
            where: {
              ...whereClause,
              success: true,
            },
          }),

          // 平均响应时间
          ctx.db.apiCall.aggregate({
            where: whereClause,
            _avg: {
              responseTime: true,
            },
          }),

          // 热门端点
          ctx.db.apiCall.groupBy({
            by: ['endpointId'],
            where: whereClause as never,
            _count: {
              endpointId: true,
            },
            orderBy: {
              _count: {
                endpointId: 'desc',
              },
            },
            take: 10,
          }),

          // 按时间段的调用次数（用于图表）
          ctx.db.apiCall.groupBy({
            by: ['createdAt'],
            where: whereClause as never,
            _count: {
              _all: true,
            },
          }),
        ]);

        const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

        // 转换数据格式
        const formattedCallsOverTime = callsOverTime.map((item: { createdAt: Date; _count: { _all: number } }) => ({
          createdAt: item.createdAt,
          count: item._count._all,
        }));

        const formattedTopEndpoints = topEndpoints.map((item: { endpointId: string; _count: { endpointId: number } }) => ({
          endpointId: item.endpointId,
          name: `Endpoint ${item.endpointId}`,
          calls: item._count.endpointId,
        }));

        return {
          totalCalls,
          successfulCalls,
          failedCalls: totalCalls - successfulCalls,
          successRate: Math.round(successRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime._avg.responseTime ?? 0),
          topEndpoints: formattedTopEndpoints,
          callsOverTime: formattedCallsOverTime,
        };
      }),
  },

  // ================== 权限管理 ==================
  permissions: {
    // 获取权限模板
    getTemplates: publicProcedure.query(() => {
      return API_PERMISSION_TEMPLATES;
    }),

    // 验证权限
    validate: publicProcedure
      .input(z.object({
        permissions: z.array(z.string()),
        category: z.string(),
        endpoint: z.string(),
      }))
      .query(({ input }) => {
        // 简单的权限验证逻辑
        const hasPermission = input.permissions.some(perm => {
          const [permCategory, permEndpoints] = perm.split(':');
          if (permCategory === input.category) {
            const endpoints = permEndpoints?.split(',') ?? [];
            return endpoints.includes(input.endpoint) || endpoints.includes('*');
          }
          return false;
        });

        return { hasPermission };
      }),
  },

  // ================== API测试 ==================
  testing: {
    // 测试API端点
    testEndpoint: publicProcedure
      .input(testApiRequestSchema)
      .mutation(async ({ ctx, input }: { ctx: { db: typeof db }; input: TestApiRequest }) => {
        // 验证API密钥
        const apiKey = await ctx.db.apiKey.findUnique({
          where: { accessKeyId: input.accessKeyId },
        });

        if (!apiKey || apiKey.status !== 'active') {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "无效的API密钥",
          });
        }

        // 验证密钥是否过期
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "API密钥已过期",
          });
        }

        // 验证配额
        if (apiKey.quotaLimit && apiKey.quotaUsed >= apiKey.quotaLimit) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "API调用配额已用完",
          });
        }

        // 查找端点
        const endpoint = await ctx.db.apiEndpoint.findFirst({
          where: {
            endpoint: input.endpoint,
            method: input.method,
          },
        });

        if (!endpoint) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "API端点不存在",
          });
        }

        // 模拟API调用（实际应用中这里会调用真实的API）
        const startTime = Date.now();
        const mockResponse = {
          code: 200,
          msg: "success",
          data: {
            message: "API调用成功",
            timestamp: new Date().toISOString(),
            endpoint: input.endpoint,
            method: input.method,
          },
        };
        const responseTime = Date.now() - startTime;

        // 记录API调用
        await ctx.db.apiCall.create({
          data: {
            apiKeyId: apiKey.id,
            endpointId: endpoint.id,
            method: input.method,
            endpoint: input.endpoint,
            parameters: JSON.stringify(input.parameters),
            response: JSON.stringify(mockResponse),
            statusCode: 200,
            responseTime,
            success: true,
            userAgent: input.userAgent,
            clientIp: input.clientIp,
          },
        });

        // 更新API密钥使用次数
        await ctx.db.apiKey.update({
          where: {
            id: apiKey.id
          },
          data: {
            quotaUsed: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });

        return {
          success: true,
          statusCode: 200,
          response: mockResponse,
          responseTime,
        };
      }),
  },

  // ================== 系统状态 ==================
  stats: {
    // 获取系统状态
    getSystemStatus: publicProcedure.query(async ({ ctx }) => {
      // 获取系统状态数据
      const [
        totalKeys,
        activeKeys,
        totalCalls,
        recentCalls,
      ] = await Promise.all([
        ctx.db.apiKey.count(),
        ctx.db.apiKey.count({ where: { status: 'active' } }),
        ctx.db.apiCall.count(),
        ctx.db.apiCall.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // 模拟系统状态数据
      const mockSystemStatus = {
        overall: "healthy" as const,
        modules: [
          {
            moduleName: "SDK API",
            status: "healthy" as const,
            cpuUsage: 25 + Math.random() * 30,
            memoryUsage: 40 + Math.random() * 20,
            connections: 120 + Math.floor(Math.random() * 50),
            lastChecked: new Date(),
          },
          {
            moduleName: "应用识别",
            status: "healthy" as const,
            cpuUsage: 60 + Math.random() * 20,
            memoryUsage: 55 + Math.random() * 15,
            connections: 85 + Math.floor(Math.random() * 30),
            lastChecked: new Date(),
          },
          {
            moduleName: "跨境识别",
            status: "warning" as const,
            cpuUsage: 80 + Math.random() * 15,
            memoryUsage: 70 + Math.random() * 20,
            connections: 45 + Math.floor(Math.random() * 25),
            lastChecked: new Date(),
          },
          {
            moduleName: "定制化能力",
            status: "healthy" as const,
            cpuUsage: 45 + Math.random() * 25,
            memoryUsage: 35 + Math.random() * 15,
            connections: 32 + Math.floor(Math.random() * 20),
            lastChecked: new Date(),
          },
          {
            moduleName: "周边接口",
            status: "healthy" as const,
            cpuUsage: 30 + Math.random() * 20,
            memoryUsage: 28 + Math.random() * 12,
            connections: 28 + Math.floor(Math.random() * 15),
            lastChecked: new Date(),
          },
        ],
        disasterRecovery: {
          currentNode: "node-01.primary",
          standbyNodes: ["node-02.standby", "node-03.standby"],
          lastSwitchTime: "2024-01-15 14:30",
          switchHistory: [
            { time: "2024-01-15 14:30", from: "node-01", to: "node-02", reason: "主动维护", status: "成功" },
            { time: "2024-01-10 09:15", from: "node-02", to: "node-01", reason: "维护完成", status: "成功" },
            { time: "2023-12-28 16:45", from: "node-01", to: "node-02", reason: "故障切换", status: "成功" },
          ],
          nodeHealth: [
            { name: "node-01.primary", status: "healthy", latency: "12ms", load: "45%" },
            { name: "node-02.standby", status: "healthy", latency: "15ms", load: "20%" },
            { name: "node-03.standby", status: "healthy", latency: "18ms", load: "25%" },
          ],
        },
        externalConnections: [
          {
            systemId: "capability-center-001",
            name: "能力服务中心",
            status: "connected" as const,
            lastSyncTime: new Date(Date.now() - 5 * 60 * 1000),
            error: null,
          },
          {
            systemId: "security-platform-002",
            name: "安全管理平台",
            status: "connected" as const,
            lastSyncTime: new Date(Date.now() - 2 * 60 * 1000),
            error: null,
          },
        ],
        statistics: {
          totalKeys,
          activeKeys,
          totalCalls,
          recentCalls,
          uptime: "99.9%",
          responseTime: "45ms",
        },
      };

      return mockSystemStatus;
    }),
  },
});