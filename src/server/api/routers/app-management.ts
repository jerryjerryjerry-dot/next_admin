import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

// 输入验证schema
const createAppSchema = z.object({
  appName: z.string().min(1, "应用名称不能为空"),
  appType: z.string().min(1, "必须选择分类"),
  ip: z.string().optional().or(z.literal("")),
  domain: z.string().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
  isBuiltIn: z.boolean().default(false),
  confidence: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    const hasIP = data.ip && data.ip.trim() !== "";
    const hasDomain = data.domain && data.domain.trim() !== "";
    const hasURL = data.url && data.url.trim() !== "";
    return hasIP || hasDomain || hasURL;
  },
  {
    message: "IP、域名、URL至少需要填写一个",
    path: ["ip"],
  }
);

const updateAppSchema = z.object({
  id: z.string().min(1),
  appName: z.string().min(1, "应用名称不能为空"),
  appType: z.string().min(1, "分类不能为空"),
  categoryPath: z.string().optional(),
  ip: z.string().optional(),
  domain: z.string().optional(),
  url: z.string().optional(),
  status: z.string().default("active"),
  isBuiltIn: z.boolean().default(false),
  confidence: z.number().min(0).max(100).optional(),
}).refine(
  (data) => data.ip ?? data.domain ?? data.url,
  {
    message: "IP、域名、URL至少需要填写一个",
    path: ["ip"],
  }
);

const searchAppSchema = z.object({
  queryType: z.enum(["ip", "domain", "url"]),
  queryValue: z.string().min(1, "查询值不能为空"),
});

const createCategorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空"),
  parentId: z.string().optional(),
});

// 应用管理路由
export const appManagementRouter = createTRPCRouter({
  // 分类管理
  categories: createTRPCRouter({
    // 获取分类树
    getTree: publicProcedure.query(async ({ ctx }) => {
      const categories = await ctx.db.appCategory.findMany({
        include: {
          children: {
            include: {
              children: true,
              _count: { select: { appEntries: true } },
            },
          },
          _count: { select: { appEntries: true } },
        },
        where: { parentId: null }, // 只获取根节点
        orderBy: { createdAt: "asc" },
      });

      // 递归计算应用数量
      type CategoryWithCount = {
        id: string;
        name: string;
        parentId: string | null;
        level: number;
        isLeaf: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: { appEntries: number };
        children?: CategoryWithCount[];
        appCount?: number;
      };
      
      const calculateAppCount = (category: {
        id: string;
        name: string;
        parentId: string | null;
        level: number;
        isLeaf: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: { appEntries: number };
        children?: unknown[];
      }): CategoryWithCount => {
        const totalCount = category._count.appEntries;
        
        if (category.children && Array.isArray(category.children)) {
          const calculatedChildren = category.children.map((child) => 
            calculateAppCount(child as typeof category)
          );
          const childrenCount = calculatedChildren.reduce((sum: number, child: CategoryWithCount) => sum + (child.appCount ?? 0), 0);
          return {
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            level: category.level,
            isLeaf: category.isLeaf,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            _count: category._count,
            children: calculatedChildren,
            appCount: totalCount + childrenCount,
          };
        }
        
        return {
          id: category.id,
          name: category.name,
          parentId: category.parentId,
          level: category.level,
          isLeaf: category.isLeaf,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          _count: category._count,
          appCount: totalCount,
        };
      };

      return categories.map(calculateAppCount);
    }),

    // 创建分类 (仅管理员)
    create: publicProcedure
      .input(createCategorySchema)
      .mutation(async ({ ctx, input }) => {
        let level = 0;

        // 如果有父分类，计算层级
        if (input.parentId) {
          const parent = await ctx.db.appCategory.findUnique({
            where: { id: input.parentId },
            select: { level: true, name: true },
          });
          
          if (!parent) {
            throw new Error("父分类不存在");
          }
          
          level = parent.level + 1;
        }

        const category = await ctx.db.appCategory.create({
          data: {
            ...input,
            level,
            isLeaf: true, // 新创建的分类默认为叶子节点
          },
        });

        // 如果有父分类，更新父分类为非叶子节点
        if (input.parentId) {
          await ctx.db.appCategory.update({
            where: { id: input.parentId },
            data: { isLeaf: false },
          });
        }

        return category;
      }),

    // 删除分类 (仅管理员)
    delete: publicProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        // 检查是否有子分类
        const childCount = await ctx.db.appCategory.count({
          where: { parentId: input },
        });
        
        if (childCount > 0) {
          throw new Error("请先删除所有子分类");
        }

        // 检查是否有关联应用
        const appCount = await ctx.db.appEntry.count({
          where: { appType: input },
        });
        
        if (appCount > 0) {
          throw new Error("请先删除该分类下的所有应用");
        }

        return ctx.db.appCategory.delete({
          where: { id: input },
        });
      }),
  }),

  // 应用管理
  apps: createTRPCRouter({
    // 获取应用列表
    getAll: publicProcedure
      .input(z.object({
        categoryId: z.string().optional(),
        isBuiltIn: z.boolean().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const where: Prisma.AppEntryWhereInput = {};
        
        if (input.categoryId) {
          where.appType = input.categoryId;
        }
        
        if (input.isBuiltIn !== undefined) {
          where.isBuiltIn = input.isBuiltIn;
        }
        
        if (input.status) {
          where.status = input.status;
        }

        const apps = await ctx.db.appEntry.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: { createdAt: "desc" },
        });

        // 转换数据格式以匹配前端期望的类型
        return apps.map(app => ({
          ...app,
          ip: app.ip ?? undefined,
          domain: app.domain ?? undefined,
          url: app.url ?? undefined,
          status: app.status as "active" | "inactive",
          confidence: app.confidence ?? undefined,
          category: app.category ? {
            id: app.category.id,
            name: app.category.name,
            createdAt: app.category.createdAt,
            updatedAt: app.category.updatedAt,
            parentId: app.category.parentId,
            level: app.category.level,
            appCount: app.category.appCount,
            isLeaf: app.category.isLeaf,
          } : undefined
        }));
      }),

    // 根据ID获取单个应用
    getById: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        const app = await ctx.db.appEntry.findUnique({
          where: { id: input },
          include: {
            category: true,
          },
        });

        if (!app) {
          throw new Error("应用不存在");
        }

        return app;
      }),

    // 创建应用
    create: publicProcedure
      .input(createAppSchema)
      .mutation(async ({ ctx, input }) => {
        // 检查分类是否存在
        const category = await ctx.db.appCategory.findUnique({
          where: { id: input.appType },
          select: { name: true, parent: { select: { name: true } } },
        });
        
        if (!category) {
          throw new Error("选择的分类不存在");
        }

        // 生成分类路径
        const categoryPath = category.parent 
          ? `${category.parent.name}/${category.name}`
          : category.name;

        // 检查重复应用 (同一分类下应用名不能重复)
        const existingApp = await ctx.db.appEntry.findFirst({
          where: {
            appName: input.appName,
            appType: input.appType,
          },
        });

        if (existingApp) {
          throw new Error("该分类下已存在同名应用");
        }

        const app = await ctx.db.appEntry.create({
          data: {
            ...input,
            categoryPath,
          },
          include: { category: true },
        });

        // 更新分类应用数量
        await ctx.db.appCategory.update({
          where: { id: input.appType },
          data: {
            appCount: {
              increment: 1,
            },
          },
        });

        return {
          ...app,
          ip: app.ip ?? undefined,
          domain: app.domain ?? undefined,
          url: app.url ?? undefined,
          status: app.status as "active" | "inactive",
          confidence: app.confidence ?? undefined,
        };
      }),

    // 更新应用
    update: publicProcedure
      .input(updateAppSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // 检查应用是否存在
        const existingApp = await ctx.db.appEntry.findUnique({
          where: { id },
          select: { isBuiltIn: true, appType: true },
        });

        if (!existingApp) {
          throw new Error("应用不存在");
        }

        // 内置应用不允许修改
        if (existingApp.isBuiltIn) {
          throw new Error("内置应用不允许修改");
        }

        // 如果修改了分类，需要更新分类路径和计数
        if (updateData.appType && updateData.appType !== existingApp.appType) {
          const newCategory = await ctx.db.appCategory.findUnique({
            where: { id: updateData.appType },
            select: { name: true, parent: { select: { name: true } } },
          });
          
          if (!newCategory) {
            throw new Error("新分类不存在");
          }

          updateData.categoryPath = newCategory.parent 
            ? `${newCategory.parent.name}/${newCategory.name}`
            : newCategory.name;

          // 更新分类计数 (旧分类-1，新分类+1)
          await Promise.all([
            ctx.db.appCategory.update({
              where: { id: existingApp.appType },
              data: { appCount: { decrement: 1 } },
            }),
            ctx.db.appCategory.update({
              where: { id: updateData.appType },
              data: { appCount: { increment: 1 } },
            }),
          ]);
        }

        const updatedApp = await ctx.db.appEntry.update({
          where: { id },
          data: updateData,
          include: { category: true },
        });

        return {
          ...updatedApp,
          ip: updatedApp.ip ?? undefined,
          domain: updatedApp.domain ?? undefined,
          url: updatedApp.url ?? undefined,
          status: updatedApp.status as "active" | "inactive",
          confidence: updatedApp.confidence ?? undefined,
        };
      }),

    // 删除应用
    delete: publicProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        // 检查应用是否存在
        const app = await ctx.db.appEntry.findUnique({
          where: { id: input },
          select: { isBuiltIn: true, appType: true },
        });

        if (!app) {
          throw new Error("应用不存在");
        }

        // 内置应用不允许删除
        if (app.isBuiltIn) {
          throw new Error("内置应用不允许删除");
        }

        // 删除应用
        await ctx.db.appEntry.delete({
          where: { id: input },
        });

        // 更新分类计数
        await ctx.db.appCategory.update({
          where: { id: app.appType },
          data: {
            appCount: {
              decrement: 1,
            },
          },
        });

        return { success: true };
      }),

    // 批量删除应用
    batchDelete: publicProcedure
      .input(z.array(z.string()).min(1, "至少选择一个应用"))
      .mutation(async ({ ctx, input }) => {
        // 检查所有应用
        const apps = await ctx.db.appEntry.findMany({
          where: { id: { in: input } },
          select: { id: true, isBuiltIn: true, appType: true },
        });

        const builtInApps = apps.filter(app => app.isBuiltIn);
        if (builtInApps.length > 0) {
          throw new Error("不能删除内置应用");
        }

        // 统计各分类删除数量
        const categoryDeleteCounts: Record<string, number> = {};
        apps.forEach(app => {
          categoryDeleteCounts[app.appType] = (categoryDeleteCounts[app.appType] ?? 0) + 1;
        });

        // 执行删除
        await ctx.db.appEntry.deleteMany({
          where: { id: { in: input } },
        });

        // 更新分类计数
        await Promise.all(
          Object.entries(categoryDeleteCounts).map(([categoryId, count]) =>
            ctx.db.appCategory.update({
              where: { id: categoryId },
              data: { appCount: { decrement: count } },
            })
          )
        );

        return { deletedCount: apps.length };
      }),

    // 批量创建应用（导入功能）
    batchCreate: publicProcedure
      .input(z.object({
        apps: z.array(createAppSchema)
      }))
      .mutation(async ({ ctx, input }) => {
        const results = {
          successCount: 0,
          skipCount: 0,
          errorCount: 0,
          errors: [] as string[]
        };

        for (const appData of input.apps) {
          try {
            // 检查分类是否存在
            const category = await ctx.db.appCategory.findUnique({
              where: { id: appData.appType },
              select: { name: true, parent: { select: { name: true } } },
            });
            
            if (!category) {
              results.errors.push(`应用 "${appData.appName}" 的分类不存在`);
              results.errorCount++;
              continue;
            }

            // 检查是否已存在相同名称的应用
            const existingApp = await ctx.db.appEntry.findFirst({
              where: {
                appName: appData.appName,
                appType: appData.appType,
              },
            });

            if (existingApp) {
              results.skipCount++;
              continue;
            }

            // 生成分类路径
            const categoryPath = category.parent 
              ? `${category.parent.name}/${category.name}`
              : category.name;

            // 创建应用
            await ctx.db.appEntry.create({
              data: {
                ...appData,
                categoryPath,
              },
            });

            // 更新分类应用数量
            await ctx.db.appCategory.update({
              where: { id: appData.appType },
              data: { appCount: { increment: 1 } },
            });

            results.successCount++;
          } catch (error) {
            results.errors.push(
              `应用 "${appData.appName}" 创建失败: ${error instanceof Error ? error.message : '未知错误'}`
            );
            results.errorCount++;
          }
        }

        return {
          ...results,
          totalProcessed: input.apps.length
        };
      }),

    // 批量导出应用
    batchExport: publicProcedure
      .input(z.array(z.string()).min(1, "至少选择一个应用"))
      .query(async ({ ctx, input }) => {
        const apps = await ctx.db.appEntry.findMany({
          where: { id: { in: input } },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        });

        // 转换为导出格式
        return apps.map(app => ({
          appName: app.appName,
          appType: app.appType,
          categoryPath: app.categoryPath,
          ip: app.ip ?? undefined,
          domain: app.domain ?? undefined,
          url: app.url ?? undefined,
          status: app.status as "active" | "inactive",
          isBuiltIn: app.isBuiltIn,
          confidence: app.confidence ?? undefined,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }));
      }),

    // 更新应用状态
    updateStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const app = await ctx.db.appEntry.findUnique({
          where: { id: input.id },
          select: { isBuiltIn: true },
        });

        if (!app) {
          throw new Error("应用不存在");
        }

        if (app.isBuiltIn) {
          throw new Error("内置应用状态不允许修改");
        }

        const updatedApp = await ctx.db.appEntry.update({
          where: { id: input.id },
          data: { status: input.status },
          include: { category: true },
        });

        return {
          ...updatedApp,
          ip: updatedApp.ip ?? undefined,
          domain: updatedApp.domain ?? undefined,
          url: updatedApp.url ?? undefined,
          status: updatedApp.status as "active" | "inactive",
          confidence: updatedApp.confidence ?? undefined,
        };
      }),

    // 搜索应用
    search: publicProcedure
      .input(searchAppSchema)
      .query(async ({ ctx, input }) => {
        const where: Prisma.AppEntryWhereInput = {};

        switch (input.queryType) {
          case "ip":
            where.ip = { contains: input.queryValue };
            break;
          case "domain":
            where.domain = { contains: input.queryValue };
            break;
          case "url":
            where.url = { contains: input.queryValue };
            break;
        }

        const searchResults = await ctx.db.appEntry.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: { createdAt: "desc" },
        });

        // 转换数据格式
        return searchResults.map(app => ({
          ...app,
          ip: app.ip ?? undefined,
          domain: app.domain ?? undefined,
          url: app.url ?? undefined,
          status: app.status as "active" | "inactive",
          confidence: app.confidence ?? undefined,
        }));
      }),
  }),

  // AI学习建议
  aiSuggestions: createTRPCRouter({
    // 获取待处理建议
    getPending: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.aiLearnSuggestion.findMany({
        where: { status: "pending" },
        orderBy: [
          { confidence: "desc" }, // 按置信度降序
          { createdAt: "desc" },
        ],
      });
    }),

    // 批量确认建议
    approve: publicProcedure
      .input(z.array(z.string()))
      .mutation(async ({ ctx, input }) => {
        // 获取建议详情
        const suggestions = await ctx.db.aiLearnSuggestion.findMany({
          where: { 
            id: { in: input },
            status: "pending",
          },
        });

        if (suggestions.length === 0) {
          throw new Error("没有找到待处理的建议");
        }

        // 获取分类信息用于生成路径
        const categoryIds = [...new Set(suggestions.map(s => s.predictedType))];
        const categories = await ctx.db.appCategory.findMany({
          where: { id: { in: categoryIds } },
          include: { parent: { select: { name: true } } },
        });

        const categoryMap = new Map(categories.map(c => [c.id, c]));

        // 创建应用并标记建议为已确认
        const appsToCreate = suggestions.map(suggestion => {
          const category = categoryMap.get(suggestion.predictedType);
          if (!category) {
            throw new Error(`分类 ${suggestion.predictedType} 不存在`);
          }

          const categoryPath = category.parent 
            ? `${category.parent.name}/${category.name}`
            : category.name;

          const appName = suggestion.domain ?? 
                          suggestion.ip ?? 
                          suggestion.url?.split('/')[2] ?? 
                          "AI发现应用";

          return {
            appName,
            appType: suggestion.predictedType,
            categoryPath,
            ip: suggestion.ip,
            domain: suggestion.domain,
            url: suggestion.url,
            confidence: suggestion.confidence,
            status: "active" as const,
            isBuiltIn: false,
          };
        });

        await ctx.db.$transaction(async (tx) => {
          // 创建应用
          for (const appData of appsToCreate) {
            await tx.appEntry.create({ data: appData });
          }

          // 标记建议为已确认
          await tx.aiLearnSuggestion.updateMany({
            where: { id: { in: input } },
            data: { status: "approved" },
          });

          // 更新分类计数
          const categoryCounts: Record<string, number> = {};
          suggestions.forEach(s => {
            categoryCounts[s.predictedType] = (categoryCounts[s.predictedType] ?? 0) + 1;
          });

          for (const [categoryId, count] of Object.entries(categoryCounts)) {
            await tx.appCategory.update({
              where: { id: categoryId },
              data: { appCount: { increment: count } },
            });
          }
        });

        return { approvedCount: suggestions.length };
      }),

    // 拒绝建议
    reject: publicProcedure
      .input(z.array(z.string()))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.aiLearnSuggestion.updateMany({
          where: { 
            id: { in: input },
            status: "pending",
          },
          data: { status: "rejected" },
        });

        return { rejectedCount: input.length };
      }),
  }),

  // 统计数据
  getStats: publicProcedure.query(async ({ ctx }) => {
    const totalApps = await ctx.db.appEntry.count();
    const activeApps = await ctx.db.appEntry.count({
      where: { status: "active" },
    });
    const inactiveApps = await ctx.db.appEntry.count({
      where: { status: "inactive" },
    });
    const builtInApps = await ctx.db.appEntry.count({
      where: { isBuiltIn: true },
    });
    const customApps = await ctx.db.appEntry.count({
      where: { isBuiltIn: false },
    });
    const pendingSuggestions = await ctx.db.aiLearnSuggestion.count({
      where: { status: "pending" },
    });

    return {
      totalApps,
      activeApps,
      inactiveApps,
      builtInApps,
      customApps,
      pendingSuggestions,
    };
  }),
});
