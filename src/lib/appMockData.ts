// 应用管理系统Mock数据
// 每隔2小时变一次，模拟真实场景

type MockDataConfig = {
  lastUpdateTime: number;
  updateInterval: number; // 2小时 = 7200000毫秒
};

const config: MockDataConfig = {
  lastUpdateTime: Date.now(),
  updateInterval: 2 * 60 * 60 * 1000, // 2小时
};

// 获取当前时间段索引（每2小时一个周期）
function getCurrentTimeSlot(): number {
  const now = Date.now();
  return Math.floor(now / config.updateInterval) % 24; // 24个时间段循环
}

// 基础分类树数据
const baseCategoryTree = [
  {
    id: "cat_001",
    name: "系统工具",
    parentId: null,
    level: 0,
    isLeaf: false,
    children: [
      {
        id: "cat_001_001",
        name: "网络工具",
        parentId: "cat_001",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 8,
      },
      {
        id: "cat_001_002",
        name: "监控工具",
        parentId: "cat_001",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 6,
      },
      {
        id: "cat_001_003",
        name: "安全工具",
        parentId: "cat_001",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 4,
      },
    ],
    baseAppCount: 18,
  },
  {
    id: "cat_002",
    name: "开发工具",
    parentId: null,
    level: 0,
    isLeaf: false,
    children: [
      {
        id: "cat_002_001",
        name: "IDE工具",
        parentId: "cat_002",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 5,
      },
      {
        id: "cat_002_002",
        name: "数据库工具",
        parentId: "cat_002",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 7,
      },
      {
        id: "cat_002_003",
        name: "版本控制",
        parentId: "cat_002",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 3,
      },
    ],
    baseAppCount: 15,
  },
  {
    id: "cat_003",
    name: "业务应用",
    parentId: null,
    level: 0,
    isLeaf: false,
    children: [
      {
        id: "cat_003_001",
        name: "Web应用",
        parentId: "cat_003",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 12,
      },
      {
        id: "cat_003_002",
        name: "移动应用",
        parentId: "cat_003",
        level: 1,
        isLeaf: true,
        children: [],
        baseAppCount: 8,
      },
    ],
    baseAppCount: 20,
  },
];

// 基础应用数据模板
const baseAppTemplates = [
  // 网络工具
  {
    categoryId: "cat_001_001",
    categoryPath: "系统工具/网络工具",
    apps: [
      {
        id: "app_001_001",
        appName: "Nginx",
        appType: "cat_001_001",
        ip: "192.168.1.100",
        domain: "nginx.local",
        url: "http://nginx.local",
        status: "active",
        isBuiltIn: true,
        confidence: 95,
      },
      {
        id: "app_001_002",
        appName: "Apache",
        appType: "cat_001_001",
        ip: "192.168.1.101",
        domain: "apache.local",
        url: "http://apache.local",
        status: "active",
        isBuiltIn: true,
        confidence: 90,
      },
      {
        id: "app_001_003",
        appName: "HAProxy",
        appType: "cat_001_001",
        ip: "192.168.1.102",
        domain: "haproxy.local",
        url: "http://haproxy.local:8080",
        status: "active",
        isBuiltIn: true,
        confidence: 88,
      },
    ]
  },
  // 数据库工具
  {
    categoryId: "cat_002_002",
    categoryPath: "开发工具/数据库工具",
    apps: [
      {
        id: "app_002_001",
        appName: "MySQL",
        appType: "cat_002_002",
        ip: "192.168.1.200",
        domain: "mysql.local",
        url: "mysql://mysql.local:3306",
        status: "active",
        isBuiltIn: true,
        confidence: 98,
      },
      {
        id: "app_002_002",
        appName: "Redis",
        appType: "cat_002_002",
        ip: "192.168.1.201",
        domain: "redis.local",
        url: "redis://redis.local:6379",
        status: "active",
        isBuiltIn: true,
        confidence: 96,
      },
      {
        id: "app_002_003",
        appName: "PostgreSQL",
        appType: "cat_002_002",
        ip: "192.168.1.202",
        domain: "postgres.local",
        url: "postgresql://postgres.local:5432",
        status: "inactive",
        isBuiltIn: true,
        confidence: 92,
      },
    ]
  },
  // Web应用
  {
    categoryId: "cat_003_001",
    categoryPath: "业务应用/Web应用",
    apps: [
      {
        id: "app_003_001",
        appName: "企业门户",
        appType: "cat_003_001",
        ip: "192.168.1.50",
        domain: "portal.company.com",
        url: "https://portal.company.com",
        status: "active",
        isBuiltIn: false,
        confidence: 85,
      },
      {
        id: "app_003_002",
        appName: "管理后台",
        appType: "cat_003_001",
        ip: "192.168.1.51",
        domain: "admin.company.com",
        url: "https://admin.company.com",
        status: "active",
        isBuiltIn: false,
        confidence: 82,
      },
    ]
  },
];

// 模拟应用数据波动
function generateDynamicAppCount(baseCount: number, timeSlot: number): number {
  // 使用时间段作为种子，产生可重现的"随机"变化
  const variation = Math.sin(timeSlot * 0.5) * 0.2; // -0.2 to 0.2 的变化
  const fluctuation = Math.floor(baseCount * variation);
  return Math.max(0, baseCount + fluctuation);
}

// 生成模拟的应用列表
function generateAppsWithVariation(timeSlot: number) {
  const apps: Array<{
    id: string;
    appName: string;
    appType: string;
    categoryPath: string;
    ip?: string;
    domain?: string;
    url?: string;
    status: string;
    isBuiltIn: boolean;
    confidence?: number;
    createdAt: string;
    updatedAt: string;
  }> = [];
  
  baseAppTemplates.forEach(template => {
    template.apps.forEach(appTemplate => {
      const app = {
        ...appTemplate,
        categoryPath: template.categoryPath,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      // 根据时间段调整状态
      if (timeSlot % 4 === 0 && !app.isBuiltIn) {
        app.status = app.status === "active" ? "inactive" : "active";
      }
      
      apps.push(app);
    });
  });
  
  return apps;
}

// 生成动态分类树
function generateDynamicCategoryTree(timeSlot: number) {
  return baseCategoryTree.map(category => ({
    ...category,
    appCount: generateDynamicAppCount(category.baseAppCount, timeSlot),
    children: category.children.map(child => ({
      ...child,
      appCount: generateDynamicAppCount((child as { baseAppCount: number }).baseAppCount ?? 0, timeSlot),
    })),
  }));
}

// AI学习建议Mock数据
const aiSuggestionTemplates = [
  {
    id: "ai_001",
    ip: "10.0.0.50",
    domain: "new-service.internal",
    predictedType: "cat_002_002",
    confidence: 85.5,
    reason: "检测到数据库连接模式，端口3306通常用于MySQL",
    status: "pending",
  },
  {
    id: "ai_002",
    domain: "monitoring.example.com",
    url: "https://monitoring.example.com/metrics",
    predictedType: "cat_001_002",
    confidence: 92.3,
    reason: "URL路径包含metrics，典型的监控系统特征",
    status: "pending",
  },
  {
    id: "ai_003",
    ip: "172.16.0.100",
    domain: "git.company.com",
    predictedType: "cat_002_003",
    confidence: 88.7,
    reason: "域名包含git关键字，典型的版本控制系统",
    status: "approved",
  },
];

// 导出的Mock数据API
export const mockAppData = {
  // 获取分类树
  getCategoryTree: () => {
    const timeSlot = getCurrentTimeSlot();
    return generateDynamicCategoryTree(timeSlot);
  },

  // 获取应用列表
  getApps: (params?: { categoryId?: string; isBuiltIn?: boolean }) => {
    const timeSlot = getCurrentTimeSlot();
    let apps = generateAppsWithVariation(timeSlot);
    
    if (params?.categoryId && params.categoryId !== "all") {
      apps = apps.filter(app => app.appType === params.categoryId);
    }
    
    if (typeof params?.isBuiltIn === "boolean") {
      apps = apps.filter(app => app.isBuiltIn === params.isBuiltIn);
    }
    
    return apps;
  },

  // 搜索应用
  searchApps: (searchParams: { queryType: string; queryValue: string }) => {
    const timeSlot = getCurrentTimeSlot();
    const apps = generateAppsWithVariation(timeSlot);
    
    return apps.filter(app => {
      const value = app[searchParams.queryType as keyof typeof app];
      return value && String(value).toLowerCase().includes(searchParams.queryValue.toLowerCase());
    });
  },

  // 获取AI建议
  getAISuggestions: () => {
    const timeSlot = getCurrentTimeSlot();
    
    return aiSuggestionTemplates.map(suggestion => ({
      ...suggestion,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      // 根据时间段调整一些建议的状态
      status: timeSlot % 3 === 0 && suggestion.status === "pending" ? "reviewed" : suggestion.status,
    }));
  },

  // 获取统计数据
  getStats: () => {
    const timeSlot = getCurrentTimeSlot();
    const apps = generateAppsWithVariation(timeSlot);
    
    return {
      totalApps: apps.length,
      activeApps: apps.filter(app => app.status === "active").length,
      inactiveApps: apps.filter(app => app.status === "inactive").length,
      builtInApps: apps.filter(app => app.isBuiltIn).length,
      customApps: apps.filter(app => !app.isBuiltIn).length,
      avgConfidence: apps.reduce((sum, app) => sum + (app.confidence ?? 0), 0) / apps.length,
    };
  },
};

