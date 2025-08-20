import { type PrismaClient } from "@prisma/client";

// API分类数据
const apiCategories = [
  {
    name: "sdk-api",
    displayName: "SDK API",
    description: "SDK版本管理、配置和审计相关接口",
    icon: "Package",
    sortOrder: 1,
  },
  {
    name: "app-recognition",
    displayName: "应用识别",
    description: "流量应用识别和分析相关接口",
    icon: "Search",
    sortOrder: 2,
  },
  {
    name: "crossborder",
    displayName: "跨境应用识别",
    description: "跨境流量识别和代理检测接口",
    icon: "Globe",
    sortOrder: 3,
  },
  {
    name: "customization",
    displayName: "定制化能力",
    description: "规则定制和模块扩展能力接口",
    icon: "Settings",
    sortOrder: 4,
  },
  {
    name: "external",
    displayName: "周边接口",
    description: "能力中心对接和统计分析接口",
    icon: "ExternalLink",
    sortOrder: 5,
  },
];

// API端点数据
const apiEndpoints = [
  // SDK API分类
  {
    categoryName: "sdk-api",
    name: "配置管理",
    endpoint: "/api/v1/sdk-api/configs",
    method: "POST",
    description: "SDK配置的增删改查操作",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        operation: { type: "string", enum: ["create", "update", "delete", "query"] },
        configId: { type: "string" },
        config: { type: "object" }
      },
      required: ["operation"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        msg: { type: "string" },
        data: { type: "object" }
      }
    }),
    rateLimit: 60,
  },
  {
    categoryName: "sdk-api",
    name: "版本查询",
    endpoint: "/api/v1/sdk-api/versions",
    method: "GET",
    description: "SDK版本及兼容性查询",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        platform: { type: "string", enum: ["windows", "linux", "macos"] }
      }
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        data: { type: "array" }
      }
    }),
    rateLimit: 120,
  },
  // 应用识别分类
  {
    categoryName: "app-recognition",
    name: "识别规则管理",
    endpoint: "/api/v1/app-recognition/rules",
    method: "POST",
    description: "应用识别规则的增删改查",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        operation: { type: "string", enum: ["create", "update", "delete", "query"] },
        ruleId: { type: "string" },
        rule: { type: "object" }
      },
      required: ["operation"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        msg: { type: "string" },
        data: { type: "object" }
      }
    }),
    rateLimit: 30,
  },
  {
    categoryName: "app-recognition",
    name: "实时流量识别",
    endpoint: "/api/v1/app-recognition/realtime",
    method: "POST",
    description: "实时流量应用识别",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        traffic: { type: "object" }
      },
      required: ["traffic"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        data: { type: "object" }
      }
    }),
    rateLimit: 1000,
  },
  // 跨境应用识别
  {
    categoryName: "crossborder",
    name: "跨境规则管理",
    endpoint: "/api/v1/crossborder/rules",
    method: "POST",
    description: "跨境识别规则管理",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        operation: { type: "string", enum: ["create", "update", "delete", "query"] },
        ruleId: { type: "string" },
        rule: { type: "object" }
      },
      required: ["operation"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        msg: { type: "string" },
        data: { type: "object" }
      }
    }),
    rateLimit: 30,
  },
  // 定制化能力
  {
    categoryName: "customization",
    name: "规则状态查询",
    endpoint: "/api/v1/customization/status",
    method: "GET",
    description: "定制规则生效状态查询",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        ruleId: { type: "string" }
      },
      required: ["ruleId"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        data: { type: "object" }
      }
    }),
    rateLimit: 60,
  },
  // 周边接口
  {
    categoryName: "external",
    name: "连接状态查询",
    endpoint: "/api/v1/周边接口/connection/status",
    method: "GET",
    description: "能力中心对接状态查询",
    requestSchema: JSON.stringify({
      type: "object",
      properties: {
        systemId: { type: "string" }
      },
      required: ["systemId"]
    }),
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        code: { type: "integer" },
        data: { type: "object" }
      }
    }),
    rateLimit: 30,
  },
];

export async function seedOpenApiData(prisma: PrismaClient) {
  console.log("开始初始化OpenAPI数据...");

  // 创建API分类
  const categoryMap = new Map<string, string>();
  
  for (const categoryData of apiCategories) {
    const category = await prisma.apiCategory.upsert({
      where: { name: categoryData.name },
      update: categoryData,
      create: categoryData,
    });
    categoryMap.set(categoryData.name, category.id);
    console.log(`创建API分类: ${category.displayName}`);
  }

  // 创建API端点
  for (const endpointData of apiEndpoints) {
    const categoryId = categoryMap.get(endpointData.categoryName);
    if (!categoryId) {
      console.error(`找不到分类: ${endpointData.categoryName}`);
      continue;
    }

    const { categoryName: _, ...endpointCreateData } = endpointData;
    
    const existingEndpoint = await prisma.apiEndpoint.findUnique({
      where: { 
        endpoint_method: {
          endpoint: endpointCreateData.endpoint,
          method: endpointCreateData.method,
        }
      },
    });

    if (existingEndpoint) {
      await prisma.apiEndpoint.update({
        where: { id: existingEndpoint.id },
        data: {
          ...endpointCreateData,
          categoryId,
        },
      });
    } else {
      await prisma.apiEndpoint.create({
        data: {
          ...endpointCreateData,
          categoryId,
        },
      });
    }
    
    console.log(`创建API端点: ${endpointCreateData.name}`);
  }

  console.log("OpenAPI数据初始化完成!");
}
