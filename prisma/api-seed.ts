import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedApiData() {
  console.log('🌱 开始填充API端点数据...');

  try {
    // 清理现有数据
    await prisma.apiCall.deleteMany();
    await prisma.apiEndpoint.deleteMany();
    await prisma.apiCategory.deleteMany();

    // 创建API分类
    const categories = await prisma.apiCategory.createMany({
      data: [
        {
          id: 'app-recognition',
          name: 'app-recognition',
          displayName: '应用识别',
          description: '应用流量识别相关API',
          icon: '🔍',
          status: 'enabled',
          sortOrder: 1,
        },
        {
          id: 'crossborder',
          name: 'crossborder',
          displayName: '跨境识别',
          description: '跨境流量识别相关API',
          icon: '🌍',
          status: 'enabled',
          sortOrder: 2,
        },
        {
          id: 'sdk-api',
          name: 'sdk-api',
          displayName: 'SDK API',
          description: 'SDK配置和管理API',
          icon: '⚙️',
          status: 'enabled',
          sortOrder: 3,
        },
        {
          id: 'customization',
          name: 'customization',
          displayName: '定制化能力',
          description: '定制化模块和容灾API',
          icon: '🔧',
          status: 'enabled',
          sortOrder: 4,
        },
        {
          id: 'external',
          name: 'external',
          displayName: '周边接口',
          description: '外部系统对接和统计API',
          icon: '🔗',
          status: 'enabled',
          sortOrder: 5,
        },
      ],
    });

    console.log(`✅ 创建了 ${categories.count} 个API分类`);

    // 创建API端点
    const endpoints = await prisma.apiEndpoint.createMany({
      data: [
        // 应用识别API端点
        {
          id: 'app-rules',
          categoryId: 'app-recognition',
          name: '应用识别规则管理',
          endpoint: '/api/v1/app-recognition/rules',
          method: 'POST',
          description: '应用识别规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: 'string',
            ruleId: 'string',
            rule: {
              domain: 'string',
              ip: 'string',
              url: 'string',
              protocol: 'string',
              matchCondition: 'string',
              categoryLabel: 'string',
            },
            status: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              ruleId: 'string',
              status: 'string',
              rules: [],
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-realtime',
          categoryId: 'app-recognition',
          name: '实时流量识别',
          endpoint: '/api/v1/app-recognition/realtime',
          method: 'POST',
          description: '对实时流量进行应用识别',
          requestSchema: JSON.stringify({
            traffic: {
              srcIp: 'string',
              dstIp: 'string',
              domain: 'string',
              url: 'string',
              protocol: 'string',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              appType: 'string',
              confidence: 0.95,
              ruleId: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 10000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-encrypted',
          categoryId: 'app-recognition',
          name: '加密流量深度识别',
          endpoint: '/api/v1/app-recognition/encrypted',
          method: 'POST',
          description: '对加密流量进行深度识别分析',
          requestSchema: JSON.stringify({
            encryptedTraffic: {
              tlsSni: 'string',
              quicInfo: 'object',
              payloadFeatures: 'object',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              appName: 'string',
              protocol: 'string',
              analysis: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 5000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-ai-predict',
          categoryId: 'app-recognition',
          name: 'AI识别模型预测',
          endpoint: '/api/v1/app-recognition/ai/predict',
          method: 'POST',
          description: '使用AI模型对未知流量进行预测',
          requestSchema: JSON.stringify({
            unknownTraffic: {
              behaviorFeatures: 'object',
              packetStats: 'object',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              predictedType: 'string',
              probability: 0.85,
              suggestion: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-abnormal-stat',
          categoryId: 'app-recognition',
          name: '异常行为识别统计',
          endpoint: '/api/v1/app-recognition/abnormal/stat',
          method: 'GET',
          description: '获取异常行为识别的统计数据',
          requestSchema: JSON.stringify({
            timeRange: 'string',
            behaviorType: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              total: 100,
              typeDistribution: {},
              topIps: [],
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },

        // 跨境识别API端点
        {
          id: 'crossborder-rules',
          categoryId: 'crossborder',
          name: '跨境识别规则管理',
          endpoint: '/api/v1/crossborder/rules',
          method: 'POST',
          description: '跨境识别规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: 'string',
            ruleId: 'string',
            rule: {
              country: 'string',
              region: 'string',
              proxyType: 'string',
              tagStrategy: 'string',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              ruleId: 'string',
              status: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'crossborder-realtime',
          categoryId: 'crossborder',
          name: '实时跨境流量识别',
          endpoint: '/api/v1/crossborder/realtime',
          method: 'POST',
          description: '对实时流量进行跨境识别',
          requestSchema: JSON.stringify({
            traffic: {
              srcIp: 'string',
              dstIp: 'string',
              proxyInfo: 'object',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              isCrossborder: true,
              region: 'string',
              proxyType: 'string',
              tag: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 10000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'crossborder-strategy',
          categoryId: 'crossborder',
          name: '标记策略生效状态',
          endpoint: '/api/v1/crossborder/strategy/status',
          method: 'GET',
          description: '查询标记策略的生效状态',
          requestSchema: JSON.stringify({
            region: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              strategyId: 'string',
              status: 'active',
              lastUpdated: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 500,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'crossborder-proxy',
          categoryId: 'crossborder',
          name: 'VPN/SD-WAN流量识别',
          endpoint: '/api/v1/crossborder/proxy/identify',
          method: 'POST',
          description: '识别VPN或SD-WAN代理流量',
          requestSchema: JSON.stringify({
            traffic: {
              tunnelFeatures: 'object',
              protocolFingerprint: 'object',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              proxyType: 'vpn',
              confidence: 0.92,
              targetRegion: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 5000,
          requireAuth: true,
          status: 'active',
        },

        // SDK API端点
        {
          id: 'sdk-configs',
          categoryId: 'sdk-api',
          name: 'SDK配置增删改查',
          endpoint: '/api/v1/sdk-api/configs',
          method: 'POST',
          description: 'SDK配置的增删改查操作',
          requestSchema: JSON.stringify({
            operation: 'string',
            configId: 'string',
            config: {
              sdkVersion: 'string',
              apiPermissions: 'array',
              auditEnabled: 'boolean',
            },
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              configId: 'string',
              status: 'string',
              configs: [],
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'sdk-versions',
          categoryId: 'sdk-api',
          name: 'SDK版本及兼容性查询',
          endpoint: '/api/v1/sdk-api/versions',
          method: 'GET',
          description: '查询SDK版本和系统兼容性',
          requestSchema: JSON.stringify({
            platform: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: [
              {
                version: 'string',
                releaseTime: 'string',
                compatibleSystems: 'array',
              }
            ],
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: false,
          status: 'active',
        },
        {
          id: 'sdk-audit-logs',
          categoryId: 'sdk-api',
          name: 'API调用审计日志',
          endpoint: '/api/v1/sdk-api/audit/logs',
          method: 'GET',
          description: '获取API调用的详细审计日志',
          requestSchema: JSON.stringify({
            apiName: 'string',
            timeRange: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: [
              {
                caller: 'string',
                callTime: 'string',
                parameters: 'object',
                result: 'object',
              }
            ],
          }),
          deprecated: false,
          rateLimit: 500,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'sdk-watermark-algorithms',
          categoryId: 'sdk-api',
          name: '水印SDK算法获取',
          endpoint: '/api/v1/sdk-api/watermark/algorithms',
          method: 'GET',
          description: '获取指定SDK版本的水印算法',
          requestSchema: JSON.stringify({
            sdkVersion: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              algorithmCode: 'string',
              docUrl: 'string',
              examples: [],
            },
          }),
          deprecated: false,
          rateLimit: 200,
          requireAuth: true,
          status: 'active',
        },

        // 定制化API端点
        {
          id: 'custom-status',
          categoryId: 'customization',
          name: '定制规则生效状态',
          endpoint: '/api/v1/customization/status',
          method: 'GET',
          description: '查询定制规则的生效状态和命中情况',
          requestSchema: JSON.stringify({
            ruleId: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              status: 'active',
              hitCount: 42,
              lastHitTime: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'custom-module-load',
          categoryId: 'customization',
          name: '模块扩展负载查询',
          endpoint: '/api/v1/customization/module/load',
          method: 'GET',
          description: '查询指定模块的负载和资源使用情况',
          requestSchema: JSON.stringify({
            moduleName: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              cpuUsage: 0.45,
              memoryUsage: 0.68,
              connections: 128,
            },
          }),
          deprecated: false,
          rateLimit: 50,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'custom-disaster-recovery',
          categoryId: 'customization',
          name: '容灾切换状态查询',
          endpoint: '/api/v1/customization/disaster-recovery/status',
          method: 'GET',
          description: '获取系统容灾切换状态和历史记录',
          requestSchema: JSON.stringify({}),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              currentNode: 'primary-node-01',
              standbyNodes: ['standby-node-02', 'standby-node-03'],
              switchHistory: [
                {
                  time: 'string',
                  from: 'string',
                  to: 'string',
                  reason: 'string',
                }
              ],
            },
          }),
          deprecated: false,
          rateLimit: 20,
          requireAuth: true,
          status: 'active',
        },

        // 周边接口API端点
        {
          id: 'external-connection-status',
          categoryId: 'external',
          name: '能力中心对接状态',
          endpoint: '/api/v1/external/connection/status',
          method: 'GET',
          description: '查询与能力服务中心的对接状态',
          requestSchema: JSON.stringify({
            systemId: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              status: 'connected',
              lastSyncTime: 'string',
              error: 'string',
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'external-capability-registered',
          categoryId: 'external',
          name: '安全能力注册查询',
          endpoint: '/api/v1/external/capability/registered',
          method: 'GET',
          description: '查询已注册的安全能力列表',
          requestSchema: JSON.stringify({}),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: [
              {
                capabilityId: 'string',
                name: 'string',
                registerTime: 'string',
                status: 'string',
              }
            ],
          }),
          deprecated: false,
          rateLimit: 50,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'external-statistics',
          categoryId: 'external',
          name: '接口调用统计',
          endpoint: '/api/v1/external/statistics',
          method: 'GET',
          description: '获取外部接口的调用统计数据',
          requestSchema: JSON.stringify({
            timeRange: 'string',
          }),
          responseSchema: JSON.stringify({
            code: 200,
            msg: 'string',
            data: {
              totalCalls: 12845,
              successRate: 0.987,
              topApis: [
                {
                  apiName: 'string',
                  calls: 'number',
                  successRate: 'number',
                }
              ],
            },
          }),
          deprecated: false,
          rateLimit: 30,
          requireAuth: true,
          status: 'active',
        },
      ],
    });

    console.log(`✅ 创建了 ${endpoints.count} 个API端点`);
    console.log('🎉 API端点数据填充完成!');
  } catch (error) {
    console.error('❌ 填充API数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子脚本
seedApiData()
  .then(() => {
    console.log('✅ 数据库种子填充成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 数据库种子填充失败:', error);
    process.exit(1);
  });

export default seedApiData;
