import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { TrafficStats } from "~/types/traffic";

// 验证Schema定义
const createRuleSchema = z.object({
  name: z.string().min(1, "规则名称不能为空").max(100, "规则名称过长"),
  appType: z.enum(["web", "app", "api"], {
    errorMap: () => ({ message: "应用类型必须是 web、app 或 api" })
  }),
  protocol: z.enum(["http", "https", "tcp", "udp"], {
    errorMap: () => ({ message: "协议类型必须是 http、https、tcp 或 udp" })
  }),
  targetIp: z.string().ip("请输入有效的IP地址"),
  priority: z.number().min(1, "优先级最小为1").max(100, "优先级最大为100")
});

const updateRuleSchema = createRuleSchema.partial();

const listQuerySchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  keyword: z.string().optional(),
  status: z.enum(["active", "inactive", "processing"]).optional(),
  appType: z.enum(["web", "app", "api"]).optional()
});

const idSchema = z.object({
  id: z.string().min(1, "规则ID不能为空")
});

const idsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "至少选择一个规则")
});

// Mock数据生成器
const generateMockStats = (): TrafficStats => {
  const now = Date.now();
  const baseTime = new Date('2024-01-15T00:00:00Z').getTime();
  const period = Math.floor((now - baseTime) / (2 * 60 * 60 * 1000)); // 2小时一个周期
  
  const generateValue = (base: number, growth: number, variance = 0.1) => {
    const trend = base + (growth * period);
    const random = 1 + (Math.random() - 0.5) * variance;
    return Math.floor(trend * random);
  };

  return {
    totalRules: generateValue(50, 2, 0.05),
    activeRules: generateValue(38, 1.5, 0.08),
    todayExecutions: generateValue(1000, 150, 0.15),
    successRate: Math.min(99.8, 95 + (period * 0.1)),
    totalTraffic: generateValue(50000, 5000, 0.2),
    dyedTraffic: generateValue(15000, 2000, 0.25),
    timestamp: new Date().toISOString()
  };
};

const generateTrendData = (hours: number) => {
  const data = [];
  const baseTime = new Date('2024-01-15T00:00:00Z').getTime();
  const intervalHours = 2;
  
  const generateValue = (base: number, growth: number, variance = 0.1) => {
    const now = Date.now();
    const period = Math.floor((now - baseTime) / (intervalHours * 60 * 60 * 1000));
    const trend = base + (growth * period);
    const random = 1 + (Math.random() - 0.5) * variance;
    return Math.floor(trend * random);
  };
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 60 * 1000);
    
    data.push({
      time: time.toISOString(),
      totalTraffic: generateValue(2000, 200, 0.3),
      dyedTraffic: generateValue(600, 80, 0.4),
      requests: generateValue(500, 50, 0.5),
      errors: Math.floor(Math.random() * 10),
    });
  }
  
  return data;
};

export const trafficRouter = createTRPCRouter({
  // 获取规则列表
  getList: publicProcedure
    .input(listQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        const where: Record<string, unknown> = {};
        
        // 应用筛选条件
        if (input.keyword?.trim()) {
          where.OR = [
            { name: { contains: input.keyword.trim() } },
            { targetIp: { contains: input.keyword.trim() } }
          ];
        }
        
        if (input.status) {
          where.status = input.status;
        }
        
        if (input.appType) {
          where.appType = input.appType;
        }
        
        // 获取总数
        const total = await ctx.db.trafficDyeingRule.count({ where });
        
        // 分页查询
        const rules = await ctx.db.trafficDyeingRule.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        });
        
        return {
          data: rules || [],
          total: total || 0,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil((total || 0) / input.pageSize)
        };
      } catch (error) {
        console.error('获取规则列表失败:', error);
        // 返回空结果而不是抛出错误，保证API稳定性
        return {
          data: [],
          total: 0,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: 0
        };
      }
    }),

  // 获取统计数据
  getStats: publicProcedure
    .query(() => {
      return generateMockStats();
    }),

  // 获取趋势数据
  getTrends: publicProcedure
    .input(z.object({ hours: z.number().min(1).max(168).default(24) }))
    .query(({ input }) => {
      return generateTrendData(input.hours);
    }),

  // 创建规则
  create: publicProcedure
    .input(createRuleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const rule = await ctx.db.trafficDyeingRule.create({
          data: {
            ...input,
            createdById: "default-user-id", // 简化认证系统
          },
        });
        
        return {
          success: true,
          message: "规则创建成功",
          data: rule
        };
      } catch (error) {
        console.error('创建规则失败:', error);
        throw new Error(error instanceof Error ? error.message : '规则创建失败');
      }
    }),

  // 更新规则
  update: publicProcedure
    .input(z.object({
      id: z.string().min(1, "规则ID不能为空"),
      data: updateRuleSchema
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 检查规则是否存在
        const existingRule = await ctx.db.trafficDyeingRule.findUnique({
          where: { id: input.id },
          select: { id: true }
        });

        if (!existingRule) {
          throw new Error("规则不存在");
        }

        const rule = await ctx.db.trafficDyeingRule.update({
          where: { id: input.id },
          data: input.data,
        });
        
        return {
          success: true,
          message: "规则更新成功",
          data: rule
        };
      } catch (error) {
        console.error('更新规则失败:', error);
        throw new Error(error instanceof Error ? error.message : '规则更新失败');
      }
    }),

  // 删除规则
  delete: publicProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查规则是否存在且用户有权限
      const existingRule = await ctx.db.trafficDyeingRule.findUnique({
        where: { id: input.id },
        select: { createdById: true }
      });

      if (!existingRule) {
        throw new Error("规则不存在");
      }

      // 简化认证系统，暂时跳过权限检查
      // 在实际应用中应该检查用户权限

      await ctx.db.trafficDyeingRule.delete({
        where: { id: input.id }
      });
      
      return {
        success: true,
        message: "规则删除成功"
      };
    }),

  // 批量删除规则
  batchDelete: publicProcedure
    .input(idsSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查所有规则是否存在且用户有权限
      const existingRules = await ctx.db.trafficDyeingRule.findMany({
        where: { 
          id: { in: input.ids } 
        },
        select: { id: true, createdById: true }
      });

      if (existingRules.length !== input.ids.length) {
        throw new Error("部分规则不存在");
      }

      // 简化认证系统，暂时跳过权限检查
      // 在实际应用中应该检查用户权限

      const result = await ctx.db.trafficDyeingRule.deleteMany({
        where: { id: { in: input.ids } }
      });
      
      return {
        success: true,
        message: `成功删除 ${result.count} 条规则`,
        deletedCount: result.count
      };
    }),

  // 执行染色
  executeDye: publicProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查规则是否存在
      const rule = await ctx.db.trafficDyeingRule.findUnique({
        where: { id: input.id }
      });

      if (!rule) {
        throw new Error("规则不存在");
      }

      if (rule.status !== "active") {
        throw new Error("只能对活跃状态的规则执行染色");
      }

      // 模拟染色执行
      const success = Math.random() > 0.05; // 95%成功率
      const dyeResult = {
        dyeId: `dye_${Date.now()}_${input.id}`,
        status: success ? 'success' : 'failed',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + Math.random() * 5000).toISOString(),
        affectedRequests: Math.floor(Math.random() * 1000) + 100,
        dyeRate: Math.min(100, 60 + Math.random() * 35),
        message: success ? '染色执行成功' : '染色执行失败，请检查网络连接'
      };

      // 更新规则的染色结果
      await ctx.db.trafficDyeingRule.update({
        where: { id: input.id },
        data: { 
          dyeResult: JSON.stringify(dyeResult),
          status: success ? "active" : "inactive"
        }
      });
      
      return {
        success: true,
        message: dyeResult.message,
        data: dyeResult
      };
    }),

  // 批量执行染色
  batchDye: publicProcedure
    .input(idsSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查所有规则是否存在且为活跃状态
      const rules = await ctx.db.trafficDyeingRule.findMany({
        where: { 
          id: { in: input.ids },
          status: "active"
        },
        select: { id: true }
      });

      if (rules.length === 0) {
        throw new Error("没有找到可执行染色的活跃规则");
      }

      let successCount = 0;
      let failedCount = 0;

      // 并行执行染色，捕获每个操作的异常
      const dyePromises = rules.map(async (rule) => {
        try {
          const success = Math.random() > 0.05; // 95%成功率
          const dyeResult = {
            dyeId: `dye_${Date.now()}_${rule.id}`,
            status: success ? 'success' : 'failed',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + Math.random() * 5000).toISOString(),
            affectedRequests: Math.floor(Math.random() * 1000) + 100,
            dyeRate: Math.min(100, 60 + Math.random() * 35),
            message: success ? '染色执行成功' : '染色执行失败，请检查网络连接'
          };

          await ctx.db.trafficDyeingRule.update({
            where: { id: rule.id },
            data: { 
              dyeResult: JSON.stringify(dyeResult),
              status: success ? "active" : "inactive"
            }
          });

          if (success) {
            successCount++;
          } else {
            failedCount++;
          }

          return { success: true, data: dyeResult, ruleId: rule.id };
        } catch (error) {
          failedCount++;
          console.error(`规则 ${rule.id} 染色失败:`, error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : '染色失败',
            ruleId: rule.id 
          };
        }
      });

      const results = await Promise.all(dyePromises);
      
      return {
        success: true,
        message: `批量染色完成：成功 ${successCount} 个，失败 ${failedCount} 个`,
        data: {
          total: rules.length,
          successCount,
          failedCount,
          results
        }
      };
    }),

  // 生成分析报告
  generateReport: publicProcedure
    .input(z.object({ 
      id: z.string().min(1, "规则ID不能为空"),
      timeRange: z.enum(["1h", "6h", "24h", "7d"]).default("24h")
    }))
    .mutation(async ({ input }) => {
      // 模拟API处理时间
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const timeRangeHours = {
        "1h": 1,
        "6h": 6, 
        "24h": 24,
        "7d": 168
      };
      
      const hours = timeRangeHours[input.timeRange];
      const trendData = generateTrendData(hours);
      
      return {
        success: true,
        message: "报告生成成功",
        data: {
          ruleId: input.id,
          timeRange: input.timeRange,
          reportId: `report_${Date.now()}`,
          summary: {
            totalRequests: trendData.reduce((sum, item) => sum + item.requests, 0),
            dyedRequests: Math.floor(trendData.reduce((sum, item) => sum + item.requests, 0) * 0.65),
            successRate: 98.5,
            avgLatency: 125.6,
            peakTraffic: Math.max(...trendData.map(item => item.totalTraffic)),
            errorRate: 0.8
          },
          trends: trendData,
          topDestinations: [
            { ip: "192.168.1.100", requests: 1250, rate: 25.3 },
            { ip: "192.168.1.101", requests: 980, rate: 19.8 },
            { ip: "192.168.1.102", requests: 756, rate: 15.3 }
          ],
          generatedAt: new Date().toISOString()
        }
      };
    }),

  // 导出数据
  exportData: publicProcedure
    .input(z.object({
      format: z.enum(["csv", "json", "excel"]).default("csv"),
      filters: z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        keyword: z.string().optional(),
        status: z.enum(["active", "inactive", "pending"]).optional(),
        appType: z.enum(["web", "app", "api"]).optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      // 模拟导出处理时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: "数据导出成功",
        data: {
          downloadUrl: `/api/download/traffic-rules-${Date.now()}.${input.format}`,
          filename: `traffic-rules-${new Date().toISOString().split('T')[0]}.${input.format}`,
          fileSize: "245 KB",
          recordCount: 127
        }
      };
    })
});
