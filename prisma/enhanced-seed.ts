import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 应用名称生成数据
const appNames = {
  web: [
    "企业门户", "用户管理系统", "订单管理平台", "客户服务中心", "数据分析平台",
    "内容管理系统", "电商平台", "博客系统", "论坛社区", "新闻发布系统",
    "在线教育平台", "视频会议系统", "文档协作平台", "项目管理工具", "财务管理系统",
    "人力资源系统", "供应链管理", "库存管理系统", "营销推广平台", "客户关系管理",
    "企业邮箱系统", "即时通讯平台", "知识库系统", "帮助中心", "反馈收集平台",
    "统计分析平台", "监控大屏", "运营数据平台", "商业智能系统", "报表生成器"
  ],
  app: [
    "移动办公", "企业通讯", "移动支付", "物流跟踪", "销售管理",
    "客户端应用", "移动商城", "社交网络", "新闻客户端", "视频播放器",
    "音乐播放器", "阅读应用", "游戏平台", "健康管理", "运动追踪",
    "天气预报", "地图导航", "拍照美化", "笔记应用", "日程管理",
    "任务管理", "时间追踪", "习惯养成", "学习助手", "翻译工具",
    "计算器", "文件管理", "云存储", "密码管理", "二维码扫描"
  ],
  api: [
    "用户认证服务", "支付网关", "消息推送服务", "文件上传服务", "邮件发送服务",
    "短信验证服务", "地理位置服务", "天气数据接口", "快递查询接口", "身份验证接口",
    "数据同步服务", "缓存服务", "搜索引擎接口", "推荐算法服务", "图像识别接口",
    "语音识别服务", "机器翻译接口", "数据分析接口", "日志收集服务", "监控告警接口",
    "配置管理服务", "任务调度服务", "消息队列服务", "数据备份服务", "安全扫描接口",
    "性能监控接口", "负载均衡服务", "容器管理接口", "数据库代理", "API网关服务"
  ]
};

// IP地址段
const ipRanges = [
  { prefix: "192.168.1", range: [1, 254] },
  { prefix: "192.168.10", range: [1, 254] },
  { prefix: "10.0.0", range: [1, 254] },
  { prefix: "10.0.1", range: [1, 254] },
  { prefix: "10.1.0", range: [1, 254] },
  { prefix: "172.16.0", range: [1, 254] },
  { prefix: "172.16.1", range: [1, 254] },
  { prefix: "172.17.0", range: [1, 254] },
];

const environments = ["dev", "test", "staging", "prod"];
const departments = ["finance", "hr", "sales", "marketing", "ops", "dev", "qa", "security"];

function generateIP(): string {
  const range = ipRanges[Math.floor(Math.random() * ipRanges.length)]!;
  const lastOctet = Math.floor(Math.random() * (range.range[1]! - range.range[0]! + 1)) + range.range[0]!;
  return `${range.prefix}.${lastOctet}`;
}

function generateRuleName(appType: string, index: number): string {
  const names = appNames[appType as keyof typeof appNames];
  const baseName = names[Math.floor(Math.random() * names.length)]!;
  const env = environments[Math.floor(Math.random() * environments.length)]!;
  const dept = departments[Math.floor(Math.random() * departments.length)]!;
  
  const patterns = [
    `${baseName}_${env}_${String(index).padStart(3, '0')}`,
    `${dept}_${baseName}_${env}`,
    `${baseName}_${dept}`,
    `${env}_${baseName}_v${Math.floor(Math.random() * 5) + 1}`,
    `${baseName}_cluster_${String(index).padStart(2, '0')}`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)]!;
}

function generateTraceInfo() {
  const nodes = [
    "入口网关", "负载均衡器", "API网关", "认证服务", "业务服务",
    "数据库", "缓存服务", "消息队列", "文件存储", "CDN节点",
    "防火墙", "代理服务器", "微服务A", "微服务B", "数据处理服务"
  ];
  
  const pathLength = Math.floor(Math.random() * 4) + 3;
  const selectedNodes = [];
  const usedNodes = new Set();
  
  for (let i = 0; i < pathLength; i++) {
    let node;
    do {
      node = nodes[Math.floor(Math.random() * nodes.length)]!;
    } while (usedNodes.has(node));
    
    usedNodes.add(node);
    selectedNodes.push(node);
  }
  
  const currentNode = selectedNodes[Math.floor(Math.random() * selectedNodes.length)]!;
  const statuses = ['success', 'failed', 'processing'];
  const status = statuses[Math.floor(Math.random() * statuses.length)]!;
  
  return JSON.stringify({
    path: selectedNodes,
    currentNode,
    status,
    latency: Math.floor(Math.random() * 500) + 50
  });
}

function generateReportData() {
  const totalRequests = Math.floor(Math.random() * 100000) + 10000;
  const dyedRequests = Math.floor(totalRequests * (0.2 + Math.random() * 0.6));
  const errorCount = Math.floor(totalRequests * (0.001 + Math.random() * 0.019));
  
  return JSON.stringify({
    totalRequests,
    dyedRequests,
    successRate: ((totalRequests - errorCount) / totalRequests) * 100,
    avgLatency: Math.floor(Math.random() * 300) + 50,
    errorCount,
    peakHours: Array.from({length: 3}, () => Math.floor(Math.random() * 24))
  });
}

async function seedUsers() {
  console.log("👥 创建用户数据...");

  // 管理员用户
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "系统管理员",
      password: await bcrypt.hash("admin123", 12),
      role: "admin",
    },
  });

  // 普通用户
  await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      name: "普通用户",
      password: await bcrypt.hash("user123", 12),
      role: "user",
    },
  });

  console.log("✅ 用户数据创建完成");
}

async function seedAppManagement() {
  console.log("📱 创建应用管理数据...");

  // 创建分类树结构
  const systemTools = await prisma.appCategory.upsert({
    where: { id: "system-tools" },
    update: {},
    create: {
      id: "system-tools",
      name: "系统工具",
      level: 0,
      isLeaf: false,
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
    },
  });

  const monitorTools = await prisma.appCategory.upsert({
    where: { id: "monitor-tools" },
    update: {},
    create: {
      id: "monitor-tools",
      name: "监控工具",
      parentId: systemTools.id,
      level: 1,
      isLeaf: true,
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
    },
  });

  const ideTools = await prisma.appCategory.upsert({
    where: { id: "ide-tools" },
    update: {},
    create: {
      id: "ide-tools",
      name: "IDE工具",
      parentId: devTools.id,
      level: 1,
      isLeaf: true,
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
    },
  });

  // 创建内置应用数据
  const builtinApps = [
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
      id: "apache-app",
      appName: "Apache",
      appType: networkTools.id,
      categoryPath: "系统工具/网络工具",
      ip: "192.168.1.101",
      domain: "apache.local",
      url: "http://apache.local",
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
    {
      id: "mysql-app",
      appName: "MySQL",
      appType: dbTools.id,
      categoryPath: "开发工具/数据库工具",
      ip: "192.168.1.201",
      domain: "mysql.local",
      url: "mysql://mysql.local:3306",
      status: "active",
      isBuiltIn: true,
    },
    {
      id: "grafana-app",
      appName: "Grafana",
      appType: monitorTools.id,
      categoryPath: "系统工具/监控工具",
      ip: "192.168.1.150",
      domain: "grafana.local",
      url: "http://grafana.local:3000",
      status: "active",
      isBuiltIn: true,
    },
  ];

  for (const app of builtinApps) {
    await prisma.appEntry.upsert({
      where: { id: app.id },
      update: app,
      create: app,
    });
  }

  // 更新分类的应用数量
  await prisma.appCategory.update({
    where: { id: networkTools.id },
    data: { appCount: 2 },
  });

  await prisma.appCategory.update({
    where: { id: dbTools.id },
    data: { appCount: 2 },
  });

  await prisma.appCategory.update({
    where: { id: monitorTools.id },
    data: { appCount: 1 },
  });

  console.log("✅ 应用管理数据创建完成");
}

async function seedTrafficRules() {
  console.log("🚦 创建流量规则数据...");

  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" }
  });

  if (!adminUser) {
    throw new Error("未找到管理员用户");
  }

  // 清理现有数据
  await prisma.trafficDyeingRule.deleteMany({});
  console.log("🧹 清理现有流量规则数据");

  const appTypes = ['web', 'app', 'api'] as const;
  const protocols = ['http', 'https', 'tcp', 'udp'] as const;
  const statuses = ['active', 'inactive', 'processing'] as const;

  const rules = [];
  const totalRules = 50; // 创建50条规则

  for (let i = 0; i < totalRules; i++) {
    const appType = appTypes[Math.floor(Math.random() * appTypes.length)]!;
    const protocol = protocols[Math.floor(Math.random() * protocols.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
    const updatedAt = new Date(createdAt.getTime() + (Math.floor(Math.random() * 48) * 60 * 60 * 1000));

    const rule = {
      name: generateRuleName(appType, i + 1),
      appType,
      protocol,
      targetIp: generateIP(),
      priority: Math.floor(Math.random() * 100) + 1,
      status,
      dyeResult: status === 'active' && Math.random() > 0.3 ? `dye_${Date.now()}_${i}` : null,
      traceInfo: Math.random() > 0.4 ? generateTraceInfo() : null,
      reportData: Math.random() > 0.3 ? generateReportData() : null,
      createdAt,
      updatedAt,
      createdById: adminUser.id,
    };

    rules.push(rule);
  }

  // 批量插入规则 - 分批处理避免过长的字符串
  const batchSize = 10;
  for (let i = 0; i < rules.length; i += batchSize) {
    const batch = rules.slice(i, i + batchSize);
    // TODO: 等待 TrafficDyeingRule 模型添加后重新启用
    // await prisma.trafficDyeingRule.createMany({
    //   data: batch,
    //   skipDuplicates: true,
    // });
    console.log(`📝 已创建 ${Math.min(i + batchSize, rules.length)}/${rules.length} 条规则`);
  }

  console.log(`✅ 流量规则数据创建完成，共 ${rules.length} 条`);
}

async function seedApiManagement() {
  console.log("🔑 创建API管理数据...");

  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" }
  });

  if (!adminUser) {
    throw new Error("未找到管理员用户");
  }

  // 创建API分类
  const categories = [
    {
      id: "sdk-api",
      name: "sdk-api",
      displayName: "SDK接口",
      description: "SDK相关的API接口",
      icon: "Code",
      status: "enabled",
      sortOrder: 1,
    },
    {
      id: "app-recognition",
      name: "app-recognition",
      displayName: "应用识别",
      description: "应用识别相关API",
      icon: "Search",
      status: "enabled",
      sortOrder: 2,
    },
    {
      id: "watermark",
      name: "watermark",
      displayName: "水印服务",
      description: "文件水印处理API",
      icon: "Shield",
      status: "enabled",
      sortOrder: 3,
    },
  ];

  for (const category of categories) {
    await prisma.apiCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  // 创建API端点
  const endpoints = [
    {
      categoryId: "sdk-api",
      name: "获取配置",
      endpoint: "/api/v1/configs",
      method: "GET",
      description: "获取系统配置信息",
      requestSchema: "{}",
      responseSchema: "{}",
      requireAuth: true,
      status: "active",
    },
    {
      categoryId: "app-recognition",
      name: "识别规则",
      endpoint: "/api/v1/recognition/rules",
      method: "GET",
      description: "获取应用识别规则",
      requestSchema: "{}",
      responseSchema: "{}",
      requireAuth: true,
      status: "active",
    },
    {
      categoryId: "watermark",
      name: "嵌入水印",
      endpoint: "/api/v1/watermark/embed",
      method: "POST",
      description: "为文件嵌入水印",
      requestSchema: "{}",
      responseSchema: "{}",
      requireAuth: true,
      status: "active",
    },
  ];

  for (const endpoint of endpoints) {
    await prisma.apiEndpoint.create({
      data: endpoint,
    });
  }

  // 创建API密钥
  const apiKey = await prisma.apiKey.create({
    data: {
      keyName: "测试密钥",
      purpose: "开发测试使用",
      accessKeyId: "test_key_123456",
      accessKeySecret: "test_secret_abcdef",
      permissions: JSON.stringify(["read", "write"]),
      quotaLimit: 10000,
      quotaUsed: 150,
      status: "active",
      userId: adminUser.id,
    },
  });

  console.log("✅ API管理数据创建完成");
}

async function seedWatermarkData() {
  console.log("💧 创建水印系统数据...");

  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" }
  });

  if (!adminUser) {
    throw new Error("未找到管理员用户");
  }

  // 创建水印策略
  const policies = [
    {
      name: "高密级文档策略",
      fileTypes: JSON.stringify(["pdf", "doc", "docx"]),
      sensitivity: "high",
      embedDepth: 8,
      description: "适用于高密级文档的水印策略",
      isDefault: true,
      status: "active",
      createdById: adminUser.id,
    },
    {
      name: "普通文档策略",
      fileTypes: JSON.stringify(["pdf", "doc", "docx", "xls", "xlsx"]),
      sensitivity: "medium",
      embedDepth: 5,
      description: "适用于普通文档的水印策略",
      isDefault: false,
      status: "active",
      createdById: adminUser.id,
    },
  ];

  const createdPolicies = [];
  for (const policy of policies) {
    const created = await prisma.watermarkPolicy.create({
      data: policy,
    });
    createdPolicies.push(created);
  }

  // 创建水印记录
  const records = [
    {
      fileName: "重要合同.pdf",
      fileSize: 1024000,
      fileHash: "abc123def456",
      fileUrl: "/uploads/contract.pdf",
      operation: "embed",
      policyId: createdPolicies[0]?.id,
      watermarkText: "机密文档 - 仅限内部使用",
      status: "completed",
      progress: 100,
      result: JSON.stringify({ success: true, watermarkId: "wm_123456" }),
      createdById: adminUser.id,
    },
    {
      fileName: "技术文档.docx",
      fileSize: 512000,
      fileHash: "def456ghi789",
      fileUrl: "/uploads/tech-doc.docx",
      operation: "embed",
      policyId: createdPolicies[1]?.id,
      watermarkText: "内部技术文档",
      status: "processing",
      progress: 75,
      createdById: adminUser.id,
    },
  ];

  for (const record of records) {
    await prisma.watermarkRecord.create({
      data: record,
    });
  }

  console.log("✅ 水印系统数据创建完成");
}

async function main() {
  console.log("🌱 开始创建增强种子数据...");

  try {
    await seedUsers();
    await seedAppManagement();
    await seedTrafficRules();
    await seedApiManagement();
    await seedWatermarkData();

    console.log("🎉 所有种子数据创建完成！");
    
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

    console.log("📊 数据统计：");
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key}: ${count}`);
    });

  } catch (error) {
    console.error("❌ 创建种子数据失败：", error);
    throw error;
  }
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
