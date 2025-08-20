import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { 
  createPolicySchema, 
  updatePolicySchema, 
  policyListSchema,
  embedWatermarkSchema,
  extractWatermarkSchema,
  recordListSchema,
} from "~/types/watermark";
import { mockPolicyService, mockStatsService } from "~/lib/mock-watermark";
import { watermarkAPI } from "~/lib/watermark-api";
import type { PrismaClient } from "@prisma/client";
import type { 
  ExtendedWatermarkPrismaClient,
  WatermarkRecordWhereInput,
} from "~/types/watermark-prisma";

// 辅助函数：根据任务状态生成进度
function getProgressFromStatus(taskStatus: string | undefined): number {
  switch (taskStatus) {
    case 'pending':
      return 5;
    case 'processing':
      return 50;
    case 'finished':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

// 辅助函数：生成预计时间
function generateEstimatedTime(progress: number): string {
  if (progress >= 100) return '已完成';
  if (progress === 0) return '处理失败';
  
  const remainingPercent = 100 - progress;
  const estimatedSeconds = Math.floor((remainingPercent / 100) * 120); // 假设总共2分钟
  
  if (estimatedSeconds < 60) {
    return `预计还需 ${estimatedSeconds} 秒`;
  } else {
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `预计还需 ${minutes}分${seconds}秒`;
  }
}

export const watermarkRouter = createTRPCRouter({
  // ==================== 策略管理 (Mock) ====================
  policy: createTRPCRouter({
    // 获取策略列表
    getList: publicProcedure
      .input(policyListSchema)
      .query(async ({ input }) => {
        return await mockPolicyService.getList(input);
      }),

    // 创建策略
    create: publicProcedure
      .input(createPolicySchema)
      .mutation(async ({ input }) => {
        return await mockPolicyService.create(input);
      }),

    // 更新策略
    update: publicProcedure
      .input(updatePolicySchema)
      .mutation(async ({ input }) => {
        return await mockPolicyService.update(input);
      }),

    // 删除策略
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await mockPolicyService.delete(input.id);
        return { success: true };
      }),

    // 获取活跃策略
    getActive: publicProcedure
      .query(async () => {
        return await mockPolicyService.getActivePolicies();
      }),

    // 根据ID获取策略
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const policy = await mockPolicyService.getById(input.id);
        if (!policy) {
          throw new Error('策略不存在');
        }
        return policy;
      }),
  }),

  // ==================== 文件处理 (tRPC + 外部API) ====================
  process: createTRPCRouter({
    // 嵌入水印
    embed: publicProcedure
      .input(embedWatermarkSchema)
      .mutation(async ({ input }) => {
        try {
          console.log('🎯 [tRPC] 嵌入水印请求:', {
            fileName: input.fileName,
            fileSize: input.fileSize,
            policyId: input.policyId,
            watermarkText: input.watermarkText?.substring(0, 20) + '...',
          });

          // 调用外部水印API
          const result = await watermarkAPI.embedWatermark(
            input.fileUrl, 
            input.watermarkText,
            `embed_${Date.now()}`
          );

          console.log('✅ [tRPC] 水印嵌入任务创建成功:', result.taskId);

          return {
            success: true,
            taskId: result.taskId,
            message: '水印嵌入任务已创建'
          };
        } catch (error) {
          console.error('❌ [tRPC] 水印嵌入失败:', error);
          throw new Error(error instanceof Error ? error.message : '水印嵌入失败');
        }
      }),

    // 提取水印
    extract: publicProcedure
      .input(extractWatermarkSchema)
      .mutation(async ({ input }) => {
        try {
          console.log('🔍 [tRPC] 提取水印请求:', {
            fileName: input.fileName,
            fileSize: input.fileSize,
          });

          // 调用外部水印API
          const result = await watermarkAPI.extractWatermark(
            input.fileUrl,
            `extract_${Date.now()}`
          );

          console.log('✅ [tRPC] 水印提取任务创建成功:', result.taskId);

          return {
            success: true,
            taskId: result.taskId,
            message: '水印提取任务已创建'
          };
        } catch (error) {
          console.error('❌ [tRPC] 水印提取失败:', error);
          throw new Error(error instanceof Error ? error.message : '水印提取失败');
        }
      }),

    // 查询任务状态
    getTaskStatus: publicProcedure
      .input(z.object({ 
        taskId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          console.log('📊 [tRPC] 查询任务状态:', input.taskId);

          // 调用外部API查询状态
          const statusResult = await watermarkAPI.getTaskStatus(input.taskId);
          
          // 类型安全的数据解析
          const apiData = statusResult.data as {
            data?: {
              task_status?: string;
              task_type?: string;
              result?: {
                code?: number;
                data?: string;
                message?: string;
              };
            };
          } | undefined;
          
          // 解析任务数据
          const taskData = apiData?.data;
          const taskStatus = taskData?.task_status;
          const taskResult = taskData?.result;
          
          // 生成进度信息
          const progress = getProgressFromStatus(taskStatus);
          const estimatedTime = generateEstimatedTime(progress);
          
          console.log('✅ [tRPC] 任务状态查询成功:', {
            taskId: input.taskId,
            status: taskStatus,
            progress: progress,
          });

          return {
            success: true,
            taskId: input.taskId,
            status: taskStatus ?? 'unknown',
            progress: progress,
            estimatedTime: estimatedTime,
            result: taskResult,
            rawData: apiData,
          };
        } catch (error) {
          console.error('❌ [tRPC] 状态查询失败:', error);
          throw new Error(error instanceof Error ? error.message : '状态查询失败');
        }
      }),

    // 检查服务健康状态
    checkHealth: publicProcedure
      .query(async () => {
        try {
          const isHealthy = await watermarkAPI.checkHealth();
          return {
            success: true,
            isHealthy,
            timestamp: new Date(),
            service: 'watermark-api',
          };
        } catch (error) {
          return {
            success: false,
            isHealthy: false,
            timestamp: new Date(),
            service: 'watermark-api',
            error: error instanceof Error ? error.message : '健康检查失败',
          };
        }
      }),
  }),

  // ==================== 记录管理 ====================
  record: createTRPCRouter({
    // 获取记录列表
    getList: publicProcedure
      .input(recordListSchema)
      .query(async ({ ctx, input }) => {
        const where: WatermarkRecordWhereInput = {};
        // 移除用户过滤限制，允许查看所有记录

        // 应用筛选条件
        if (input.keyword) {
          where.OR = [
            { fileName: { contains: input.keyword } },
            { watermarkText: { contains: input.keyword } },
          ];
        }

        if (input.operation) {
          where.operation = input.operation;
        }

        if (input.status) {
          where.status = input.status;
        }

        if (input.policyId) {
          where.policyId = input.policyId;
        }

        if (input.dateRange) {
          where.createdAt = {
            gte: input.dateRange.start,
            lte: input.dateRange.end,
          };
        }

        // 查询总数
        const total = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.count({ where });

        // 查询分页数据
        const records = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.findMany({
          where,
          include: {
            policy: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        });

        return {
          list: records,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }),

    // 获取记录详情
    getDetail: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const record = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.findUnique({
          where: { 
            id: input.id,
          },
          include: {
            policy: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!record) {
          throw new Error('记录不存在');
        }
        // 移除用户权限验证，允许访问所有记录

        return record;
      }),

    // 重试失败的记录
    retry: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        // 注意：这是一个简化的重试实现
        // 在真实场景中，你可能需要从数据库获取原始记录信息
        console.log('🔄 [tRPC] 重试请求:', input.id);
        
        // 暂时返回成功，实际实现需要根据业务需求
        return {
          success: true,
          message: '重试请求已提交，请手动重新处理文件',
        };
      }),
  }),

  // ==================== 统计数据 (Mock) ====================
  stats: createTRPCRouter({
    // 获取Dashboard统计数据
    getDashboard: publicProcedure
      .query(async ({ ctx }) => {
        // 获取Mock统计数据
        const mockStats = await mockStatsService.getDashboard();
        
        // 获取真实的基础统计数据
        const [todayStart, todayEnd] = [
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date(new Date().setHours(23, 59, 59, 999)),
        ];

        const db = ctx.db as PrismaClient & ExtendedWatermarkPrismaClient;
        
        const [todayEmbeds, todayExtracts, totalRecords, completedRecords] = await Promise.all([
          db.watermarkRecord.count({
            where: {
              operation: 'embed',
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          }),
          db.watermarkRecord.count({
            where: {
              operation: 'extract',
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          }),
          db.watermarkRecord.count(),
          db.watermarkRecord.count({
            where: {
              status: 'completed',
            },
          }),
        ]);
        const successRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0;

        // 合并真实数据和Mock数据
        return {
          ...mockStats,
          todayEmbeds: todayEmbeds ?? mockStats.todayEmbeds,
          todayExtracts: todayExtracts ?? mockStats.todayExtracts,
          totalRecords: totalRecords ?? mockStats.totalRecords,
          successRate: totalRecords > 10 ? successRate : mockStats.successRate,
        };
      }),

    // 获取用户活动统计
    getUserActivity: publicProcedure
      .input(z.object({
        days: z.number().min(1).max(30).default(7),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const records = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.findMany({
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            operation: true,
            status: true,
            createdAt: true,
          },
        });

        // 按日期分组统计
        const dailyStats: Record<string, { embeds: number; extracts: number; }> = {};
        
        records.forEach((record) => {
          const date = record.createdAt.toISOString().split('T')[0]!;
          dailyStats[date] ??= { embeds: 0, extracts: 0 };
          if (record.operation === 'embed') {
            dailyStats[date].embeds++;
          } else {
            dailyStats[date].extracts++;
          }
        });

        return Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats,
        }));
      }),
  }),
});
