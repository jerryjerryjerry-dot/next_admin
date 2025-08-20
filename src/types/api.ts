// tRPC API类型定义
import type { AppRouter } from "~/server/api/root";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// 修复tRPC类型推断问题的工具类型
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// 基于数据库模型的精确类型定义
import type { AppCategory, AppEntry, AiLearnSuggestion } from "@prisma/client";

// 分类树节点类型
export interface CategoryTreeNode extends AppCategory {
  children: CategoryTreeNode[];
  appCount: number;
  _count: { appEntries: number };
}

// 应用管理相关的精确类型
export type AppManagementTypes = {
  // 分类相关
  categories: {
    getTree: {
      output: CategoryTreeNode[];
    };
    create: {
      input: { name: string; parentId?: string };
      output: AppCategory;
    };
    delete: {
      input: string;
      output: AppCategory;
    };
  };
  
  // 应用相关
  apps: {
    getAll: {
      input: {
        categoryId?: string;
        isBuiltIn?: boolean;
        status?: "active" | "inactive";
      };
      output: (AppEntry & { 
        category?: AppCategory;
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        confidence?: number;
      })[];
    };
    create: {
      input: {
        appName: string;
        appType: string;
        ip?: string;
        domain?: string;
        url?: string;
        status?: "active" | "inactive";
        isBuiltIn?: boolean;
        confidence?: number;
      };
      output: AppEntry & {
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        confidence?: number;
      };
    };
    update: {
      input: {
        id: string;
        appName: string;
        appType: string;
        categoryPath?: string;
        ip?: string;
        domain?: string;
        url?: string;
        status: string;
        isBuiltIn?: boolean;
        confidence?: number;
      };
      output: AppEntry & {
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        confidence?: number;
      };
    };
    delete: {
      input: string;
      output: { success: boolean };
    };
    search: {
      input: {
        queryType: "ip" | "domain" | "url";
        queryValue: string;
      };
      output: (AppEntry & {
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        confidence?: number;
      })[];
    };
    batchDelete: {
      input: string[];
      output: { deletedCount: number };
    };
    batchCreate: {
      input: {
        apps: {
          appName: string;
          appType: string;
          ip?: string;
          domain?: string;
          url?: string;
          status?: "active" | "inactive";
          isBuiltIn?: boolean;
          confidence?: number;
        }[];
      };
      output: {
        successCount: number;
        skipCount: number;
        errorCount: number;
        errors: string[];
        totalProcessed: number;
      };
    };
    batchExport: {
      input: string[];
      output: {
        appName: string;
        appType: string;
        categoryPath: string;
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        isBuiltIn: boolean;
        confidence?: number;
        createdAt: Date;
        updatedAt: Date;
      }[];
    };
    updateStatus: {
      input: {
        id: string;
        status: "active" | "inactive";
      };
      output: AppEntry & {
        ip?: string;
        domain?: string;
        url?: string;
        status: "active" | "inactive";
        confidence?: number;
      };
    };
  };
  
  // AI建议相关
  aiSuggestions: {
    getPending: {
      output: AiLearnSuggestion[];
    };
    approve: {
      input: string[];
      output: { approvedCount: number };
    };
    reject: {
      input: string[];
      output: { rejectedCount: number };
    };
  };

  // 统计数据
  getStats: {
    output: {
      totalApps: number;
      activeApps: number;
      inactiveApps: number;
      builtInApps: number;
      customApps: number;
      pendingSuggestions: number;
    };
  };
};
