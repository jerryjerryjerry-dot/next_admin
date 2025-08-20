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
  WatermarkRecordCreateInput,
  WatermarkRecordUpdateInput,
  WatermarkTaskResponse,
} from "~/types/watermark-prisma";

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

  // ==================== 文件处理 (真实API) ====================
  process: createTRPCRouter({
    // 嵌入水印
    embed: publicProcedure
      .input(embedWatermarkSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. 调用真实API嵌入水印
          const embedResult = await watermarkAPI.embedWatermark(
            input.fileUrl, 
            input.watermarkText
          );

          // 2. 创建数据库记录
          const recordData: WatermarkRecordCreateInput = {
            fileName: input.fileName,
            fileSize: input.fileSize,
            fileUrl: input.fileUrl,
            operation: 'embed',
            policyId: input.policyId,
            watermarkText: input.watermarkText,
            taskId: embedResult.taskId,
            status: 'processing',
            progress: 10,
            metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            createdById: 'anonymous-user', // 无认证模式下的默认用户
          };

          const record = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.create({
            data: recordData,
          });

          return {
            success: true,
            recordId: record.id,
            taskId: embedResult.taskId,
          };
        } catch (error) {
          // 记录失败信息
          const failedRecordData: WatermarkRecordCreateInput = {
            fileName: input.fileName,
            fileSize: input.fileSize,
            fileUrl: input.fileUrl,
            operation: 'embed',
            policyId: input.policyId,
            watermarkText: input.watermarkText,
            status: 'failed',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : '嵌入失败',
            metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            createdById: 'anonymous-user', // 无认证模式下的默认用户
          };

          await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.create({
            data: failedRecordData,
          });

          throw new Error(error instanceof Error ? error.message : '水印嵌入失败');
        }
      }),

    // 提取水印
    extract: publicProcedure
      .input(extractWatermarkSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. 调用真实API提取水印
          const extractResult = await watermarkAPI.extractWatermark(input.fileUrl);

          // 2. 创建数据库记录
          const recordData: WatermarkRecordCreateInput = {
            fileName: input.fileName,
            fileSize: input.fileSize,
            fileUrl: input.fileUrl,
            operation: 'extract',
            taskId: extractResult.taskId,
            status: 'processing',
            progress: 10,
            metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            createdById: 'anonymous-user', // 无认证模式下的默认用户
          };

          const record = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.create({
            data: recordData,
          });

          return {
            success: true,
            recordId: record.id,
            taskId: extractResult.taskId,
          };
        } catch (error) {
          // 记录失败信息
          const failedRecordData: WatermarkRecordCreateInput = {
            fileName: input.fileName,
            fileSize: input.fileSize,
            fileUrl: input.fileUrl,
            operation: 'extract',
            status: 'failed',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : '提取失败',
            metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            createdById: 'anonymous-user', // 无认证模式下的默认用户
          };

          await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.create({
            data: failedRecordData,
          });

          throw new Error(error instanceof Error ? error.message : '水印提取失败');
        }
      }),

    // 查询任务状态并更新记录
    getTaskStatus: publicProcedure
      .input(z.object({ 
        taskId: z.string(),
        recordId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          // 1. 调用真实API查询状态
          const statusResult = await watermarkAPI.getTaskStatus(input.taskId);
          
          // 2. Mock优化进度显示
          const mockProgress = mockStatsService.generateProgress(statusResult.data);
          
          // 3. 更新数据库记录
          const taskResponse = statusResult as WatermarkTaskResponse;
          const updateData: WatermarkRecordUpdateInput = {
            progress: mockProgress,
          };

          // 根据真实状态更新记录
          if (taskResponse.data?.task_status === 'finished') {
            updateData.status = 'completed';
            updateData.progress = 100;
            updateData.result = JSON.stringify(
              mockStatsService.enhanceProcessResult(statusResult.data)
            );
          } else if (taskResponse.data?.task_status === 'failed') {
            updateData.status = 'failed';
            updateData.progress = 0;
            updateData.errorMessage = taskResponse.data?.result?.message ?? '处理失败';
          } else if (taskResponse.data?.task_status === 'processing') {
            updateData.status = 'processing';
          }

          await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.update({
            where: { id: input.recordId },
            data: updateData,
          });

          // 4. 返回优化后的状态数据
          return {
            ...statusResult,
            progress: mockProgress,
            estimatedTime: mockStatsService.generateEstimatedTime(mockProgress),
            enhancedResult: updateData.result ? JSON.parse(updateData.result) as unknown : null,
          };
        } catch (error) {
          console.error('状态查询失败:', error);
          throw new Error(error instanceof Error ? error.message : '状态查询失败');
        }
      }),

    // 检查服务健康状态
    checkHealth: publicProcedure
      .query(async () => {
        const isHealthy = await watermarkAPI.checkHealth();
        return {
          isHealthy,
          timestamp: new Date(),
          service: 'watermark-api',
        };
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

    // 重新处理失败的记录
    retry: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const record = await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.findUnique({
          where: { 
            id: input.id,
          },
        });

        if (!record) {
          throw new Error('记录不存在');
        }
        // 移除用户权限验证，允许重试所有记录

        if (record.status !== 'failed') {
          throw new Error('只能重试失败的记录');
        }

        try {
          let taskResult;
          if (record.operation === 'embed') {
            if (!record.watermarkText) {
              throw new Error('缺少水印文本');
            }
            taskResult = await watermarkAPI.embedWatermark(
              record.fileUrl, 
              record.watermarkText
            );
          } else {
            taskResult = await watermarkAPI.extractWatermark(record.fileUrl);
          }

          // 更新记录状态
          const updateData: WatermarkRecordUpdateInput = {
            taskId: taskResult.taskId,
            status: 'processing',
            progress: 10,
            errorMessage: undefined,
          };

          await (ctx.db as PrismaClient & ExtendedWatermarkPrismaClient).watermarkRecord.update({
            where: { id: input.id },
            data: updateData,
          });

          return {
            success: true,
            taskId: taskResult.taskId,
          };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : '重试失败');
        }
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
