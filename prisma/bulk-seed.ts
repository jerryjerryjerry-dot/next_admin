import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// 设置中文locale (注释掉，使用默认英文)

async function main() {
  console.log("开始批量数据库种子数据初始化...");

  // 清空现有数据
  await prisma.apiCall.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.apiEndpoint.deleteMany({});
  await prisma.apiCategory.deleteMany({});
  await prisma.watermarkRecord.deleteMany({});
  await prisma.watermarkPolicy.deleteMany({});
  await prisma.aiLearnSuggestion.deleteMany({});
  await prisma.appEntry.deleteMany({});
  await prisma.appCategory.deleteMany({});
  await prisma.trafficDyeingRule.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("已清空现有数据");

  // 1. 创建100+用户
  console.log("创建用户数据...");
  const users = [];
  
  // 创建管理员用户
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@admin.com",
      name: "系统管理员",
      role: "admin",
      password: "admin123",
      emailVerified: new Date(),
    },
  });
  users.push(adminUser);

  // 创建普通用户
  for (let i = 0; i < 150; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@${faker.internet.domainName()}`,
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement(["user", "admin"]),
        password: faker.internet.password(),
        image: faker.image.avatar(),
        emailVerified: faker.datatype.boolean() ? faker.date.past() : null,
      },
    });
    users.push(user);
  }
  console.log(`创建了 ${users.length} 个用户`);

  // 2. 创建100+帖子
  console.log("创建帖子数据...");
  for (let i = 0; i < 120; i++) {
    await prisma.post.create({
      data: {
        name: faker.lorem.sentence(),
        createdById: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log("创建了 120 个帖子");

  // 3. 创建应用分类和条目
  console.log("创建应用分类数据...");
  const categories = [];
  
  // 创建主分类
  const mainCategories = [
    "系统工具", "网络工具", "开发工具", "数据库工具", "监控工具", 
    "安全工具", "办公软件", "娱乐应用", "社交应用", "购物应用",
    "教育应用", "金融应用", "医疗应用", "旅游应用", "新闻应用"
  ];

  for (const categoryName of mainCategories) {
    const category = await prisma.appCategory.create({
      data: {
        name: categoryName,
        level: 0,
        appCount: faker.number.int({ min: 5, max: 20 }),
        isLeaf: false,
      },
    });
    categories.push(category);

    // 为每个主分类创建子分类
    for (let j = 0; j < faker.number.int({ min: 3, max: 8 }); j++) {
      const subCategory = await prisma.appCategory.create({
        data: {
          name: `${categoryName}-${faker.lorem.word()}`,
          parentId: category.id,
          level: 1,
          appCount: faker.number.int({ min: 1, max: 10 }),
          isLeaf: true,
        },
      });
      categories.push(subCategory);
    }
  }
  console.log(`创建了 ${categories.length} 个应用分类`);

  // 4. 创建应用条目
  console.log("创建应用条目数据...");
  const leafCategories = categories.filter(cat => cat.isLeaf);
  for (let i = 0; i < 200; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    await prisma.appEntry.create({
      data: {
        appName: faker.company.name(),
        appType: category.id,
        categoryPath: `${category.name}/${faker.lorem.word()}`,
        ip: faker.internet.ip(),
        domain: faker.internet.domainName(),
        url: faker.internet.url(),
        status: faker.helpers.arrayElement(["active", "inactive", "pending"]),
        isBuiltIn: faker.datatype.boolean(),
        confidence: faker.number.float({ min: 0.1, max: 1.0 }),
      },
    });
  }
  console.log("创建了 200 个应用条目");

  // 5. 创建流量染色规则
  console.log("创建流量染色规则数据...");
  const protocols = ["HTTP", "HTTPS", "TCP", "UDP", "MQTT", "WebSocket"];
  const appTypes = ["web", "mobile", "desktop", "api", "service"];
  
  for (let i = 0; i < 150; i++) {
    await prisma.trafficDyeingRule.create({
      data: {
        name: `规则-${faker.lorem.words(2)}`,
        appType: faker.helpers.arrayElement(appTypes),
        protocol: faker.helpers.arrayElement(protocols),
        targetIp: faker.internet.ip(),
        priority: faker.number.int({ min: 1, max: 10 }),
        status: faker.helpers.arrayElement(["active", "inactive", "pending"]),
        dyeResult: faker.datatype.boolean() ? JSON.stringify({
          matched: true,
          timestamp: faker.date.recent(),
          metadata: faker.lorem.sentence()
        }) : null,
        traceInfo: faker.datatype.boolean() ? JSON.stringify({
          traceId: faker.string.uuid(),
          spanId: faker.string.alphanumeric(16),
          duration: faker.number.int({ min: 1, max: 1000 })
        }) : null,
        reportData: faker.datatype.boolean() ? JSON.stringify({
          bytes: faker.number.int({ min: 1024, max: 1048576 }),
          packets: faker.number.int({ min: 1, max: 1000 })
        }) : null,
        createdById: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log("创建了 150 个流量染色规则");

  // 6. 创建AI学习建议
  console.log("创建AI学习建议数据...");
  for (let i = 0; i < 100; i++) {
    await prisma.aiLearnSuggestion.create({
      data: {
        ip: faker.internet.ip(),
        domain: faker.internet.domainName(),
        url: faker.internet.url(),
        predictedType: faker.helpers.arrayElement(appTypes),
        confidence: faker.number.float({ min: 0.1, max: 1.0 }),
        reason: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(["pending", "approved", "rejected"]),
      },
    });
  }
  console.log("创建了 100 个AI学习建议");

  // 7. 创建API分类和端点
  console.log("创建API管理数据...");
  const apiCategories = [];
  const apiCategoryNames = [
    "用户管理", "内容管理", "支付接口", "通知服务", "文件上传",
    "数据分析", "系统监控", "安全认证", "第三方集成", "报表生成"
  ];

  for (const categoryName of apiCategoryNames) {
    const apiCategory = await prisma.apiCategory.create({
      data: {
        name: categoryName.toLowerCase().replace(/\s+/g, '_'),
        displayName: categoryName,
        description: faker.lorem.sentence(),
        icon: faker.helpers.arrayElement(["user", "content", "payment", "notification", "upload"]),
        status: "enabled",
        sortOrder: faker.number.int({ min: 1, max: 100 }),
      },
    });
    apiCategories.push(apiCategory);
  }

  // 为每个API分类创建端点
  for (const category of apiCategories) {
    for (let i = 0; i < faker.number.int({ min: 8, max: 15 }); i++) {
      await prisma.apiEndpoint.create({
        data: {
          categoryId: category.id,
          name: faker.lorem.words(3),
          endpoint: `/api/${category.name}/${faker.lorem.word()}`,
          method: faker.helpers.arrayElement(["GET", "POST", "PUT", "DELETE", "PATCH"]),
          description: faker.lorem.sentence(),
          requestSchema: JSON.stringify({
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              data: { type: "object" }
            }
          }),
          responseSchema: JSON.stringify({
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" }
            }
          }),
          deprecated: faker.datatype.boolean(),
          rateLimit: faker.datatype.boolean() ? faker.number.int({ min: 10, max: 1000 }) : null,
          requireAuth: faker.datatype.boolean(),
          status: faker.helpers.arrayElement(["active", "inactive", "deprecated"]),
        },
      });
    }
  }
  console.log(`创建了 ${apiCategories.length} 个API分类和相关端点`);

  // 8. 创建API密钥
  console.log("创建API密钥数据...");
  for (let i = 0; i < 50; i++) {
    await prisma.apiKey.create({
      data: {
        keyName: `API密钥-${faker.lorem.word()}`,
        purpose: faker.lorem.sentence(),
        accessKeyId: faker.string.alphanumeric(20),
        accessKeySecret: faker.string.alphanumeric(40),
        permissions: JSON.stringify(faker.helpers.arrayElements([
          "read", "write", "delete", "admin", "user_management", "api_access"
        ])),
        quotaLimit: faker.datatype.boolean() ? faker.number.int({ min: 100, max: 10000 }) : null,
        quotaUsed: faker.number.int({ min: 0, max: 500 }),
        status: faker.helpers.arrayElement(["active", "inactive", "expired"]),
        lastUsedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        expiresAt: faker.datatype.boolean() ? faker.date.future() : null,
        userId: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log("创建了 50 个API密钥");

  // 9. 创建水印策略
  console.log("创建水印策略数据...");
  const watermarkPolicies = [];
  for (let i = 0; i < 30; i++) {
    const policy = await prisma.watermarkPolicy.create({
      data: {
        name: `水印策略-${faker.lorem.word()}`,
        fileTypes: JSON.stringify(faker.helpers.arrayElements([
          "pdf", "docx", "xlsx", "pptx", "txt", "jpg", "png", "mp4", "mp3"
        ])),
        sensitivity: faker.helpers.arrayElement(["low", "medium", "high"]),
        embedDepth: faker.number.int({ min: 1, max: 10 }),
        description: faker.lorem.sentence(),
        isDefault: i === 0, // 第一个设为默认
        status: faker.helpers.arrayElement(["active", "inactive"]),
        createdById: faker.helpers.arrayElement(users).id,
      },
    });
    watermarkPolicies.push(policy);
  }
  console.log("创建了 30 个水印策略");

  // 10. 创建水印记录
  console.log("创建水印记录数据...");
  for (let i = 0; i < 200; i++) {
    await prisma.watermarkRecord.create({
      data: {
        fileName: faker.system.fileName(),
        fileSize: faker.number.int({ min: 1024, max: 104857600 }), // 1KB to 100MB
        fileHash: faker.string.alphanumeric(64),
        fileUrl: faker.internet.url(),
        operation: faker.helpers.arrayElement(["embed", "extract", "verify"]),
        policyId: faker.datatype.boolean() ? faker.helpers.arrayElement(watermarkPolicies).id : null,
        watermarkText: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        taskId: faker.string.uuid(),
        status: faker.helpers.arrayElement(["pending", "processing", "completed", "failed"]),
        progress: faker.number.int({ min: 0, max: 100 }),
        result: faker.datatype.boolean() ? JSON.stringify({
          success: faker.datatype.boolean(),
          watermarkFound: faker.datatype.boolean(),
          extractedText: faker.lorem.sentence()
        }) : null,
        metadata: JSON.stringify({
          fileType: faker.system.fileExt(),
          processingTime: faker.number.int({ min: 100, max: 5000 }),
          quality: faker.number.float({ min: 0.1, max: 1.0 })
        }),
        errorMessage: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        createdById: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log("创建了 200 个水印记录");

  // 11. 创建密码重置令牌
  console.log("创建密码重置令牌数据...");
  for (let i = 0; i < 50; i++) {
    await prisma.passwordResetToken.create({
      data: {
        email: faker.helpers.arrayElement(users).email!,
        token: faker.string.alphanumeric(32),
        expires: faker.date.future(),
        used: faker.datatype.boolean(),
      },
    });
  }
  console.log("创建了 50 个密码重置令牌");

  // 12. 创建会话
  console.log("创建会话数据...");
  for (let i = 0; i < 80; i++) {
    await prisma.session.create({
      data: {
        sessionToken: faker.string.alphanumeric(32),
        userId: faker.helpers.arrayElement(users).id,
        expires: faker.date.future(),
      },
    });
  }
  console.log("创建了 80 个会话");

  // 13. 创建账户
  console.log("创建账户数据...");
  const providers = ["google", "github", "discord", "facebook", "twitter"];
  for (let i = 0; i < 60; i++) {
    const provider = faker.helpers.arrayElement(providers);
    await prisma.account.create({
      data: {
        userId: faker.helpers.arrayElement(users).id,
        type: "oauth",
        provider: provider,
        providerAccountId: faker.string.alphanumeric(20),
        refresh_token: faker.datatype.boolean() ? faker.string.alphanumeric(50) : null,
        access_token: faker.string.alphanumeric(50),
        expires_at: faker.datatype.boolean() ? Math.floor(faker.date.future().getTime() / 1000) : null,
        token_type: "Bearer",
        scope: "read write",
        id_token: faker.datatype.boolean() ? faker.string.alphanumeric(100) : null,
      },
    });
  }
  console.log("创建了 60 个账户");

  // 14. 创建验证令牌
  console.log("创建验证令牌数据...");
  for (let i = 0; i < 40; i++) {
    await prisma.verificationToken.create({
      data: {
        identifier: faker.internet.email(),
        token: faker.string.alphanumeric(32),
        expires: faker.date.future(),
      },
    });
  }
  console.log("创建了 40 个验证令牌");

  // 获取创建的API端点
  const apiEndpoints = await prisma.apiEndpoint.findMany();
  const apiKeys = await prisma.apiKey.findMany();

  // 15. 创建API调用记录
  console.log("创建API调用记录数据...");
  for (let i = 0; i < 500; i++) {
    const endpoint = faker.helpers.arrayElement(apiEndpoints);
    const apiKey = faker.helpers.arrayElement(apiKeys);
    
    await prisma.apiCall.create({
      data: {
        apiKeyId: apiKey.id,
        endpointId: endpoint.id,
        method: endpoint.method,
        endpoint: endpoint.endpoint,
        parameters: faker.datatype.boolean() ? JSON.stringify({
          query: faker.lorem.word(),
          limit: faker.number.int({ min: 1, max: 100 })
        }) : null,
        response: JSON.stringify({
          success: faker.datatype.boolean(),
          data: faker.lorem.sentence(),
          timestamp: faker.date.recent()
        }),
        statusCode: faker.helpers.arrayElement([200, 201, 400, 401, 403, 404, 500]),
        responseTime: faker.number.int({ min: 10, max: 5000 }),
        success: faker.datatype.boolean(),
        errorMessage: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        userAgent: faker.internet.userAgent(),
        clientIp: faker.internet.ip(),
      },
    });
  }
  console.log("创建了 500 个API调用记录");

  // 显示最终统计
  const finalStats = {
    users: await prisma.user.count(),
    posts: await prisma.post.count(),
    appCategories: await prisma.appCategory.count(),
    appEntries: await prisma.appEntry.count(),
    trafficRules: await prisma.trafficDyeingRule.count(),
    aiSuggestions: await prisma.aiLearnSuggestion.count(),
    apiCategories: await prisma.apiCategory.count(),
    apiEndpoints: await prisma.apiEndpoint.count(),
    apiKeys: await prisma.apiKey.count(),
    apiCalls: await prisma.apiCall.count(),
    watermarkPolicies: await prisma.watermarkPolicy.count(),
    watermarkRecords: await prisma.watermarkRecord.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
    sessions: await prisma.session.count(),
    accounts: await prisma.account.count(),
    verificationTokens: await prisma.verificationToken.count(),
  };

  console.log("\n=== 最终数据库统计 ===");
  Object.entries(finalStats).forEach(([key, count]) => {
    console.log(`${key}: ${count} 条记录`);
  });
  
  console.log("\n批量数据库种子数据初始化完成!");
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
