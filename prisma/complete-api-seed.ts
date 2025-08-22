import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCompleteApiData() {
  console.log('🌱 开始填充完整API端点数据...');

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
          displayName: '跨境应用识别',
          description: '跨境流量识别相关API',
          icon: '🌍',
          status: 'enabled',
          sortOrder: 2,
        },
        {
          id: 'app-management',
          name: 'app-management',
          displayName: '应用管理',
          description: '应用库管理相关API',
          icon: '📱',
          status: 'enabled',
          sortOrder: 3,
        },
        {
          id: 'traffic-dyeing',
          name: 'traffic-dyeing',
          displayName: '流量染色',
          description: '流量染色和追踪API',
          icon: '🎨',
          status: 'enabled',
          sortOrder: 4,
        },
        {
          id: 'watermark',
          name: 'watermark',
          displayName: '数字水印管理',
          description: '数字水印相关API',
          icon: '💧',
          status: 'enabled',
          sortOrder: 5,
        },
        {
          id: 'watermark-trace',
          name: 'watermark-trace',
          displayName: '水印溯源及分析',
          description: '水印溯源和审计API',
          icon: '🔍',
          status: 'enabled',
          sortOrder: 6,
        },
        {
          id: 'sdk-api',
          name: 'sdk-api',
          displayName: '开放接口',
          description: 'SDK配置和管理API',
          icon: '⚙️',
          status: 'enabled',
          sortOrder: 7,
        },
        {
          id: 'customization',
          name: 'customization',
          displayName: '定制化及扩展能力',
          description: '定制化模块和容灾API',
          icon: '🔧',
          status: 'enabled',
          sortOrder: 8,
        },
        {
          id: 'external',
          name: 'external',
          displayName: '周边接口',
          description: '外部系统对接和统计API',
          icon: '🔗',
          status: 'enabled',
          sortOrder: 9,
        },
      ],
    });

    console.log(`✅ 创建了 ${categories.count} 个API分类`);

    // 创建API端点
    const endpoints = await prisma.apiEndpoint.createMany({
      data: [
        // 应用识别 API端点
        {
          id: 'app-rules-crud',
          categoryId: 'app-recognition',
          name: '应用识别规则增删改查',
          endpoint: '/api/v1/app-recognition/rules',
          method: 'POST',
          description: '应用识别规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            ruleId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            rule: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                domain: { type: 'string', description: '域名识别维度' },
                ip: { type: 'string', description: 'IP识别维度' },
                url: { type: 'string', description: 'URL识别维度' },
                protocol: { type: 'string', description: '协议识别维度' },
                matchCondition: { type: 'string', description: '匹配条件' },
                categoryLabel: { type: 'string', description: '分类标签' },
              },
            },
            status: { type: 'string', required: false, description: '启用/禁用，query过滤' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: {
              type: 'object',
              description: 'query返回规则列表/详情，其他返回操作结果',
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-realtime-recognition',
          categoryId: 'app-recognition',
          name: '实时流量识别',
          endpoint: '/api/v1/app-recognition/realtime',
          method: 'POST',
          description: '对实时流量进行应用识别',
          requestSchema: JSON.stringify({
            traffic: {
              type: 'object',
              required: true,
              properties: {
                srcIp: { type: 'string', description: '源IP地址' },
                dstIp: { type: 'string', description: '目标IP地址' },
                domain: { type: 'string', description: '域名' },
                url: { type: 'string', description: 'URL路径' },
                protocol: { type: 'string', description: '协议类型' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                appType: { type: 'string', description: '应用类型' },
                confidence: { type: 'number', description: '置信度' },
                ruleId: { type: 'string', description: '匹配的规则ID' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 10000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-encrypted-recognition',
          categoryId: 'app-recognition',
          name: '加密流量深度识别',
          endpoint: '/api/v1/app-recognition/encrypted',
          method: 'POST',
          description: '对加密流量进行深度识别分析',
          requestSchema: JSON.stringify({
            encryptedTraffic: {
              type: 'object',
              required: true,
              properties: {
                tlsSni: { type: 'string', description: 'TLS SNI信息' },
                quicInfo: { type: 'object', description: 'QUIC协议信息' },
                payloadFeatures: { type: 'object', description: 'payload特征' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                appName: { type: 'string', description: '应用名称' },
                protocol: { type: 'string', description: '协议类型' },
                analysis: { type: 'string', description: '分析结果' },
              },
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
              type: 'object',
              required: true,
              properties: {
                behaviorFeatures: { type: 'object', description: '流量行为特征' },
                packetStats: { type: 'object', description: '数据包统计' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                predictedType: { type: 'string', description: '预测类型' },
                probability: { type: 'number', description: '概率' },
                suggestion: { type: 'string', description: '建议' },
              },
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
            timeRange: { type: 'string', required: true, description: '时间范围，如"2024-08-01至2024-08-08"' },
            behaviorType: { type: 'string', required: false, description: '行为类型，如dataSteal/botnet' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number', description: '总数' },
                typeDistribution: { type: 'object', description: '类型分布' },
                topIps: { type: 'array', description: '高频IP列表' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },

        // 跨境应用识别 API端点
        {
          id: 'crossborder-rules-crud',
          categoryId: 'crossborder',
          name: '跨境识别规则增删改查',
          endpoint: '/api/v1/crossborder/rules',
          method: 'POST',
          description: '跨境识别规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            ruleId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            rule: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                country: { type: 'string', description: '国家' },
                region: { type: 'string', description: '地区' },
                proxyType: { type: 'string', description: '代理类型vpn/sdwan' },
                tagStrategy: { type: 'string', description: '标记策略' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: '同应用识别结构' },
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
              type: 'object',
              required: true,
              properties: {
                srcIp: { type: 'string', description: '源IP' },
                dstIp: { type: 'string', description: '目标IP' },
                proxyInfo: { type: 'object', description: '代理信息' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                isCrossborder: { type: 'boolean', description: '是否跨境' },
                region: { type: 'string', description: '地区' },
                proxyType: { type: 'string', description: '代理类型' },
                tag: { type: 'string', description: '标记' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 10000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'crossborder-strategy-status',
          categoryId: 'crossborder',
          name: '标记策略生效状态',
          endpoint: '/api/v1/crossborder/strategy/status',
          method: 'GET',
          description: '查询标记策略的生效状态',
          requestSchema: JSON.stringify({
            region: { type: 'string', required: false, description: '指定区域' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                strategyId: { type: 'string', description: '策略ID' },
                status: { type: 'string', description: '状态' },
                lastUpdated: { type: 'string', description: '最后更新时间' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 500,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'crossborder-proxy-identify',
          categoryId: 'crossborder',
          name: 'VPN/SD-WAN流量识别',
          endpoint: '/api/v1/crossborder/proxy/identify',
          method: 'POST',
          description: '识别VPN或SD-WAN代理流量',
          requestSchema: JSON.stringify({
            traffic: {
              type: 'object',
              required: true,
              properties: {
                tunnelFeatures: { type: 'object', description: '隧道特征' },
                protocolFingerprint: { type: 'object', description: '协议指纹' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                proxyType: { type: 'string', description: '代理类型' },
                confidence: { type: 'number', description: '置信度' },
                targetRegion: { type: 'string', description: '目标区域' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 5000,
          requireAuth: true,
          status: 'active',
        },

        // 应用管理 API端点
        {
          id: 'app-library-entries-crud',
          categoryId: 'app-management',
          name: '应用库条目增删改查',
          endpoint: '/api/v1/app-library/entries',
          method: 'POST',
          description: '应用库条目的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            entryId: { type: 'string|array', required: false, description: 'update/delete/query时必选，支持批量' },
            entry: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                ip: { type: 'string', description: 'IP地址' },
                domain: { type: 'string', description: '域名' },
                url: { type: 'string', description: 'URL' },
                appType: { type: 'string', description: '应用类型' },
                status: { type: 'string', description: '状态' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: 'query返回条目列表，其他返回操作结果' },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-library-update-status',
          categoryId: 'app-management',
          name: '应用库更新状态查询',
          endpoint: '/api/v1/app-library/update/status',
          method: 'GET',
          description: '查询应用库的更新状态',
          requestSchema: JSON.stringify({
            type: { type: 'string', required: false, description: 'full/incremental' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                lastUpdateTime: { type: 'string', description: '最后更新时间' },
                added: { type: 'number', description: '新增数量' },
                deleted: { type: 'number', description: '删除数量' },
                status: { type: 'string', description: '状态' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-library-query',
          categoryId: 'app-management',
          name: '应用条目精确查询',
          endpoint: '/api/v1/app-library/query',
          method: 'GET',
          description: '根据key和type精确查询应用条目',
          requestSchema: JSON.stringify({
            key: { type: 'string', required: true, description: 'ip/domain/url' },
            type: { type: 'string', required: true, description: 'ip/domain/url' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                entryId: { type: 'string', description: '条目ID' },
                appType: { type: 'string', description: '应用类型' },
                updateTime: { type: 'string', description: '更新时间' },
                status: { type: 'string', description: '状态' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 5000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'app-library-auto-learn',
          categoryId: 'app-management',
          name: '自动学习新应用列表',
          endpoint: '/api/v1/app-library/auto-learn/entries',
          method: 'GET',
          description: '获取自动学习发现的新应用列表',
          requestSchema: JSON.stringify({
            timeRange: { type: 'string', required: true, description: '时间范围' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'array',
              description: '新应用列表',
              items: {
                type: 'object',
                properties: {
                  ip: { type: 'string', description: 'IP地址' },
                  domain: { type: 'string', description: '域名' },
                  predictedType: { type: 'string', description: '预测类型' },
                  confidence: { type: 'number', description: '置信度' },
                },
              },
            },
          }),
          deprecated: false,
          rateLimit: 200,
          requireAuth: true,
          status: 'active',
        },

        // 流量染色 API端点
        {
          id: 'traffic-dyeing-rules-crud',
          categoryId: 'traffic-dyeing',
          name: '流量染色规则增删改查',
          endpoint: '/api/v1/traffic-dyeing/rules',
          method: 'POST',
          description: '流量染色规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            ruleId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            rule: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                appType: { type: 'string', description: '应用类型触发条件' },
                protocol: { type: 'string', description: '协议触发条件' },
                ip: { type: 'string', description: 'IP触发条件' },
                dyeTag: { type: 'string', description: '染色标识' },
                priority: { type: 'number', description: '优先级' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: '同前结构' },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'traffic-dyeing-dye',
          categoryId: 'traffic-dyeing',
          name: '实时流量染色',
          endpoint: '/api/v1/traffic-dyeing/dye',
          method: 'POST',
          description: '对指定流量进行实时染色',
          requestSchema: JSON.stringify({
            trafficId: { type: 'string', required: true, description: '流量ID' },
            ruleId: { type: 'string', required: true, description: '规则ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                dyeId: { type: 'string', description: '染色ID' },
                dyeInfo: { type: 'string', description: '染色信息' },
                timestamp: { type: 'string', description: '时间戳' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 10000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'traffic-dyeing-trace',
          categoryId: 'traffic-dyeing',
          name: '染色流量追踪',
          endpoint: '/api/v1/traffic-dyeing/trace',
          method: 'GET',
          description: '追踪染色流量的传播路径',
          requestSchema: JSON.stringify({
            dyeId: { type: 'string', required: true, description: '染色ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                path: {
                  type: 'array',
                  description: '传播路径',
                  items: {
                    type: 'object',
                    properties: {
                      nodeIp: { type: 'string', description: '节点IP' },
                      timestamp: { type: 'string', description: '时间' },
                    },
                  },
                },
                currentNode: { type: 'string', description: '当前节点' },
                status: { type: 'string', description: '状态' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'traffic-dyeing-report',
          categoryId: 'traffic-dyeing',
          name: '染色流量分析报告',
          endpoint: '/api/v1/traffic-dyeing/report',
          method: 'GET',
          description: '生成染色流量的详细分析报告',
          requestSchema: JSON.stringify({
            dyeId: { type: 'string', required: true, description: '染色ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                delay: { type: 'number', description: '延迟' },
                lossRate: { type: 'number', description: '丢包率' },
                destinations: { type: 'array', description: '目标列表' },
                abnormal: { type: 'boolean', description: '是否异常' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 500,
          requireAuth: true,
          status: 'active',
        },

        // 数字水印管理 API端点
        {
          id: 'watermark-policies-crud',
          categoryId: 'watermark',
          name: '水印策略增删改查',
          endpoint: '/api/v1/watermark/policies',
          method: 'POST',
          description: '数字水印策略的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            policyId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            policy: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                fileType: { type: 'string', description: '文件类型' },
                sensitivity: { type: 'string', description: '敏感度' },
                embedDepth: { type: 'number', description: '嵌入深度' },
                permissions: { type: 'object', description: '权限关联' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: '同前结构' },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-embed',
          categoryId: 'watermark',
          name: '文件水印实时嵌入',
          endpoint: '/api/v1/watermark/embed',
          method: 'POST',
          description: '对文件进行实时水印嵌入',
          requestSchema: JSON.stringify({
            file: { type: 'binary', required: true, description: '文件内容' },
            policyId: { type: 'string', required: true, description: '策略ID' },
            meta: { type: 'object', required: false, description: '用户/设备信息' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                watermarkId: { type: 'string', description: '水印ID' },
                fileHash: { type: 'string', description: '文件哈希' },
                embedResult: { type: 'string', description: '嵌入结果' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-policy-adapt',
          categoryId: 'watermark',
          name: '水印策略适配查询',
          endpoint: '/api/v1/watermark/policy/adapt',
          method: 'GET',
          description: '查询适合指定文件的水印策略',
          requestSchema: JSON.stringify({
            fileType: { type: 'string', required: true, description: '文件类型' },
            sensitivity: { type: 'string', required: true, description: '敏感度high/medium/low' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                policyId: { type: 'string', description: '策略ID' },
                embedDepth: { type: 'number', description: '嵌入深度' },
                compatibility: { type: 'string', description: '兼容性' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 5000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-extract',
          categoryId: 'watermark',
          name: '截图/片段水印提取',
          endpoint: '/api/v1/watermark/extract',
          method: 'POST',
          description: '从文件片段中提取水印信息',
          requestSchema: JSON.stringify({
            fileFragment: { type: 'binary', required: true, description: '文件片段' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                watermarkId: { type: 'string', description: '水印ID' },
                meta: { type: 'object', description: '元数据' },
                extractRate: { type: 'number', description: '提取率' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 2000,
          requireAuth: true,
          status: 'active',
        },

        // 水印溯源及分析 API端点
        {
          id: 'watermark-trace-rules-crud',
          categoryId: 'watermark-trace',
          name: '水印溯源规则增删改查',
          endpoint: '/api/v1/watermark/trace/rules',
          method: 'POST',
          description: '水印溯源规则的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            ruleId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            rule: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                traceDimension: { type: 'string', description: '溯源维度' },
                reportTemplate: { type: 'string', description: '报告模板' },
                alertThreshold: { type: 'number', description: '告警阈值' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: '同前结构' },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-trace-path',
          categoryId: 'watermark-trace',
          name: '水印流转路径查询',
          endpoint: '/api/v1/watermark/trace/path',
          method: 'GET',
          description: '查询水印的完整流转路径',
          requestSchema: JSON.stringify({
            watermarkId: { type: 'string', required: true, description: '水印ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                path: {
                  type: 'array',
                  description: '流转路径',
                  items: {
                    type: 'object',
                    properties: {
                      device: { type: 'string', description: '设备' },
                      time: { type: 'string', description: '时间' },
                      operation: { type: 'string', description: '操作' },
                    },
                  },
                },
                currentHolder: { type: 'string', description: '当前持有者' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 1000,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-compliance-report',
          categoryId: 'watermark-trace',
          name: '合规审计报告生成',
          endpoint: '/api/v1/watermark/trace/report/compliance',
          method: 'POST',
          description: '生成水印合规审计报告',
          requestSchema: JSON.stringify({
            watermarkId: { type: 'string', required: true, description: '水印ID' },
            timeRange: { type: 'string', required: true, description: '时间范围' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                reportId: { type: 'string', description: '报告ID' },
                violations: { type: 'number', description: '违规次数' },
                pdfUrl: { type: 'string', description: 'PDF下载链接' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'watermark-change-stat',
          categoryId: 'watermark-trace',
          name: '水印变更记录统计',
          endpoint: '/api/v1/watermark/trace/change/stat',
          method: 'GET',
          description: '统计水印的变更记录',
          requestSchema: JSON.stringify({
            watermarkId: { type: 'string', required: true, description: '水印ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                totalChanges: { type: 'number', description: '总变更次数' },
                changeTypes: { type: 'object', description: '变更类型' },
                riskLevel: { type: 'string', description: '风险等级' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 500,
          requireAuth: true,
          status: 'active',
        },

        // 开放接口 API端点
        {
          id: 'sdk-configs-crud',
          categoryId: 'sdk-api',
          name: 'SDK配置增删改查',
          endpoint: '/api/v1/sdk-api/configs',
          method: 'POST',
          description: 'SDK配置的增删改查操作',
          requestSchema: JSON.stringify({
            operation: { type: 'string', required: true, description: 'create/update/delete/query' },
            configId: { type: 'string', required: false, description: 'update/delete/query时必选' },
            config: {
              type: 'object',
              required: false,
              description: 'create/update时必选',
              properties: {
                sdkVersion: { type: 'string', description: 'SDK版本' },
                apiPermissions: { type: 'array', description: 'API权限' },
                auditEnabled: { type: 'boolean', description: '审计开关' },
              },
            },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '200成功/400失败' },
            msg: { type: 'string', description: '响应消息' },
            data: { type: 'object', description: '同前结构' },
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
          description: '查询SDK版本和系统兼容性信息',
          requestSchema: JSON.stringify({
            platform: { type: 'string', required: false, description: 'windows/linux/macos' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'array',
              description: '版本列表',
              items: {
                type: 'object',
                properties: {
                  version: { type: 'string', description: '版本号' },
                  releaseTime: { type: 'string', description: '发布时间' },
                  compatibleSystems: { type: 'array', description: '兼容系统' },
                },
              },
            },
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
            apiName: { type: 'string', required: false, description: 'API名称' },
            timeRange: { type: 'string', required: true, description: '时间范围' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'array',
              description: '审计日志',
              items: {
                type: 'object',
                properties: {
                  caller: { type: 'string', description: '调用者' },
                  callTime: { type: 'string', description: '调用时间' },
                  parameters: { type: 'object', description: '参数' },
                  result: { type: 'object', description: '结果' },
                },
              },
            },
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
            sdkVersion: { type: 'string', required: true, description: 'SDK版本' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                algorithmCode: { type: 'string', description: '算法代码' },
                docUrl: { type: 'string', description: '文档链接' },
                examples: { type: 'array', description: '示例' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 200,
          requireAuth: true,
          status: 'active',
        },

        // 定制化及扩展能力 API端点
        {
          id: 'customization-status',
          categoryId: 'customization',
          name: '定制规则生效状态',
          endpoint: '/api/v1/customization/status',
          method: 'GET',
          description: '查询定制规则的生效状态和命中情况',
          requestSchema: JSON.stringify({
            ruleId: { type: 'string', required: true, description: '规则ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', description: '状态' },
                hitCount: { type: 'number', description: '命中次数' },
                lastHitTime: { type: 'string', description: '最后命中时间' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 100,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'customization-module-load',
          categoryId: 'customization',
          name: '模块扩展负载查询',
          endpoint: '/api/v1/customization/module/load',
          method: 'GET',
          description: '查询指定模块的负载和资源使用情况',
          requestSchema: JSON.stringify({
            moduleName: { type: 'string', required: true, description: '模块名称' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                cpuUsage: { type: 'number', description: 'CPU使用率' },
                memoryUsage: { type: 'number', description: '内存使用率' },
                connections: { type: 'number', description: '连接数' },
              },
            },
          }),
          deprecated: false,
          rateLimit: 50,
          requireAuth: true,
          status: 'active',
        },
        {
          id: 'customization-disaster-recovery',
          categoryId: 'customization',
          name: '容灾切换状态查询',
          endpoint: '/api/v1/customization/disaster-recovery/status',
          method: 'GET',
          description: '获取系统容灾切换状态和历史记录',
          requestSchema: JSON.stringify({}),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                currentNode: { type: 'string', description: '当前节点' },
                standbyNodes: { type: 'array', description: '备用节点' },
                switchHistory: {
                  type: 'array',
                  description: '切换历史',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: 'string', description: '时间' },
                      from: { type: 'string', description: '源节点' },
                      to: { type: 'string', description: '目标节点' },
                      reason: { type: 'string', description: '原因' },
                    },
                  },
                },
              },
            },
          }),
          deprecated: false,
          rateLimit: 20,
          requireAuth: true,
          status: 'active',
        },

        // 周边接口 API端点
        {
          id: 'external-connection-status',
          categoryId: 'external',
          name: '能力中心对接状态',
          endpoint: '/api/v1/external/connection/status',
          method: 'GET',
          description: '查询与能力服务中心的对接状态',
          requestSchema: JSON.stringify({
            systemId: { type: 'string', required: true, description: '能力服务中心ID' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', description: '连接状态' },
                lastSyncTime: { type: 'string', description: '最后同步时间' },
                error: { type: 'string', description: '错误信息' },
              },
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
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'array',
              description: '安全能力列表',
              items: {
                type: 'object',
                properties: {
                  capabilityId: { type: 'string', description: '能力ID' },
                  name: { type: 'string', description: '能力名称' },
                  registerTime: { type: 'string', description: '注册时间' },
                  status: { type: 'string', description: '状态' },
                },
              },
            },
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
            timeRange: { type: 'string', required: true, description: '时间范围' },
          }),
          responseSchema: JSON.stringify({
            code: { type: 'number', description: '响应码' },
            data: {
              type: 'object',
              properties: {
                totalCalls: { type: 'number', description: '总调用次数' },
                successRate: { type: 'number', description: '成功率' },
                topApis: {
                  type: 'array',
                  description: '热门API',
                  items: {
                    type: 'object',
                    properties: {
                      apiName: { type: 'string', description: 'API名称' },
                      calls: { type: 'number', description: '调用次数' },
                      successRate: { type: 'number', description: '成功率' },
                    },
                  },
                },
              },
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
    console.log('🎉 完整API端点数据填充完成!');
  } catch (error) {
    console.error('❌ 填充完整API数据时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子脚本
seedCompleteApiData()
  .then(() => {
    console.log('✅ 完整数据库种子填充成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 完整数据库种子填充失败:', error);
    process.exit(1);
  });

export default seedCompleteApiData;
