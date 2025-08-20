import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始创建简单种子数据...");

  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "系统管理员",
      password: await bcrypt.hash("admin123", 12),
      role: "admin",
    },
  });

  // 创建普通用户
  const normalUser = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      name: "普通用户",
      password: await bcrypt.hash("user123", 12),
      role: "user",
    },
  });

  // 创建系统默认用户（用于无认证模式）
  const defaultUser = await prisma.user.upsert({
    where: { id: "default-user-id" },
    update: {},
    create: {
      id: "default-user-id",
      email: "system@default.com",
      name: "系统默认用户",
      password: await bcrypt.hash("system123", 12),
      role: "system",
    },
  });

  // 创建匿名用户（用于无认证模式）
  const anonymousUser = await prisma.user.upsert({
    where: { id: "anonymous-user" },
    update: {},
    create: {
      id: "anonymous-user",
      email: "anonymous@system.com",
      name: "匿名用户",
      password: await bcrypt.hash("anonymous123", 12),
      role: "user",
    },
  });

  console.log("✅ 用户数据创建完成");

  // 创建应用分类
  const systemTools = await prisma.appCategory.upsert({
    where: { id: "system-tools" },
    update: {},
    create: {
      id: "system-tools",
      name: "系统工具",
      level: 0,
      isLeaf: false,
      appCount: 0,
    },
  });

  const networkTools = await prisma.appCategory.upsert({
    where: { id: "network-tools" },
    update: {},
    create: {
      id: "network-tools",
      name: "网络工具",
      parentId: systemTools.id,
      level: 1,
      isLeaf: true,
      appCount: 0,
    },
  });

  const devTools = await prisma.appCategory.upsert({
    where: { id: "dev-tools" },
    update: {},
    create: {
      id: "dev-tools",
      name: "开发工具",
      level: 0,
      isLeaf: false,
      appCount: 0,
    },
  });

  const dbTools = await prisma.appCategory.upsert({
    where: { id: "db-tools" },
    update: {},
    create: {
      id: "db-tools",
      name: "数据库工具",
      parentId: devTools.id,
      level: 1,
      isLeaf: true,
      appCount: 0,
    },
  });

  console.log("✅ 应用分类创建完成");

  // 创建内置应用
  const apps = [
    {
      id: "nginx-app",
      appName: "Nginx",
      appType: networkTools.id,
      categoryPath: "系统工具/网络工具",
      ip: "192.168.1.100",
      domain: "nginx.local",
      url: "http://nginx.local",
      status: "active",
      isBuiltIn: true,
    },
    {
      id: "redis-app",
      appName: "Redis",
      appType: dbTools.id,
      categoryPath: "开发工具/数据库工具",
      ip: "192.168.1.200",
      domain: "redis.local",
      url: "redis://redis.local:6379",
      status: "active",
      isBuiltIn: true,
    },
  ];

  for (const app of apps) {
    await prisma.appEntry.upsert({
      where: { id: app.id },
      update: app,
      create: app,
    });
  }

  console.log("✅ 应用数据创建完成");

  // 创建简单的流量规则
  const trafficRules = [
    {
      name: "Web应用流量监控",
      appType: "web",
      protocol: "http",
      targetIp: "192.168.1.100",
      priority: 1,
      status: "active",
      createdById: defaultUser.id,
    },
    {
      name: "API服务监控",
      appType: "api",
      protocol: "https",
      targetIp: "192.168.1.101",
      priority: 2,
      status: "active",
      createdById: defaultUser.id,
    },
    {
      name: "移动应用监控",
      appType: "app",
      protocol: "tcp",
      targetIp: "192.168.1.102",
      priority: 3,
      status: "inactive",
      createdById: defaultUser.id,
    },
  ];

  for (const rule of trafficRules) {
    await prisma.trafficDyeingRule.create({
      data: rule,
    });
  }

  console.log("✅ 流量规则创建完成");

  // 创建API分类和密钥
  const apiCategory = await prisma.apiCategory.create({
    data: {
      name: "system-api",
      displayName: "系统接口",
      description: "系统核心API接口",
      icon: "Settings",
      status: "enabled",
      sortOrder: 1,
    },
  });

  const apiEndpoint = await prisma.apiEndpoint.create({
    data: {
      categoryId: apiCategory.id,
      name: "获取系统状态",
      endpoint: "/api/v1/system/status",
      method: "GET",
      description: "获取系统运行状态",
      requestSchema: "{}",
      responseSchema: "{}",
      requireAuth: true,
      status: "active",
    },
  });

  const apiKey = await prisma.apiKey.create({
    data: {
      keyName: "系统测试密钥",
      purpose: "开发测试使用",
      accessKeyId: "test_key_123456789",
      accessKeySecret: "test_secret_abcdefghijklmnop",
      permissions: JSON.stringify(["read", "write"]),
      quotaLimit: 1000,
      quotaUsed: 10,
      status: "active",
      userId: defaultUser.id,
    },
  });

  console.log("✅ API管理数据创建完成");

  // 创建水印策略
  const watermarkPolicy = await prisma.watermarkPolicy.create({
    data: {
      name: "标准文档策略",
      fileTypes: JSON.stringify(["pdf", "doc", "docx"]),
      sensitivity: "medium",
      embedDepth: 5,
      description: "适用于一般文档的水印策略",
      isDefault: true,
      status: "active",
      createdById: defaultUser.id,
    },
  });

  const watermarkRecord = await prisma.watermarkRecord.create({
    data: {
      fileName: "测试文档.pdf",
      fileSize: 1024000,
      fileHash: "abc123def456ghi789",
      fileUrl: "/uploads/test-document.pdf",
      operation: "embed",
      policyId: watermarkPolicy.id,
      watermarkText: "测试水印 - 机密文档",
      status: "completed",
      progress: 100,
      result: JSON.stringify({ success: true, watermarkId: "wm_test_123" }),
      createdById: defaultUser.id,
    },
  });

  console.log("✅ 水印系统数据创建完成");

  const stats = {
    users: await prisma.user.count(),
    categories: await prisma.appCategory.count(),
    apps: await prisma.appEntry.count(),
    trafficRules: await prisma.trafficDyeingRule.count(),
    apiCategories: await prisma.apiCategory.count(),
    apiEndpoints: await prisma.apiEndpoint.count(),
    apiKeys: await prisma.apiKey.count(),
    watermarkPolicies: await prisma.watermarkPolicy.count(),
    watermarkRecords: await prisma.watermarkRecord.count(),
  };

  console.log("🎉 简单种子数据创建完成！");
  console.log("📊 数据统计：");
  Object.entries(stats).forEach(([key, count]) => {
    console.log(`   ${key}: ${count}`);
  });

  console.log("\n📝 测试账户：");
  console.log(`   管理员: admin@test.com / admin123`);
  console.log(`   普通用户: user@test.com / user123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 种子数据创建时出错：", e);
    await prisma.$disconnect();
    process.exit(1);
  });
