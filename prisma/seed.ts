import { PrismaClient } from "@prisma/client";
import { seedOpenApiData } from "./openapi-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("开始数据库种子数据初始化...");

  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      email: "admin@admin.com",
      // username: "admin",
      name: "System Admin",
      role: "admin",
      password: "admin123", // 实际项目中应该加密
    },
  });
  console.log("创建管理员用户:", adminUser.name);

  // 创建普通用户
  const normalUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      // username: "normaluser",
      name: "Normal User",
      role: "user",
      password: "user123", // 实际项目中应该加密
    },
  });
  console.log("创建普通用户:", normalUser.name);

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      email: "test@test.com",
      // username: "testuser",
      name: "Test User",
      role: "user",
      password: "test123", // 实际项目中应该加密
    },
  });
  console.log("创建测试用户:", testUser.name);

  // 创建一些示例帖子
  const post1 = await prisma.post.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "欢迎使用系统",
      createdById: adminUser.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "用户指南",
      createdById: normalUser.id,
    },
  });

  console.log("创建示例帖子:", post1.name, post2.name);

  // 初始化OpenAPI相关数据
  await seedOpenApiData(prisma);

  // 显示统计信息
  const stats = {
    users: await prisma.user.count(),
    posts: await prisma.post.count(),
    apiCategories: await prisma.apiCategory.count(),
    apiEndpoints: await prisma.apiEndpoint.count(),
  };
  
  console.log("数据库统计:", stats);
  console.log("数据库种子数据初始化完成!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });