import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOptimizedApiCallsData() {
  console.log('🚀 创建优化的API调用数据 (极端性能数据)...');

  try {
    // 清理旧的API调用数据
    await prisma.apiCall.deleteMany();

    // 获取测试数据
    const testUser = await prisma.user.findFirst({
      where: { email: 'test-user@example.com' }
    });

    if (!testUser) {
      throw new Error('测试用户不存在');
    }

    const endpoints = await prisma.apiEndpoint.findMany();
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: testUser.id }
    });

    if (endpoints.length === 0 || apiKeys.length === 0) {
      console.log('⚠️ 需要先运行API端点和密钥种子数据脚本');
      return;
    }

    console.log(`📊 将为 ${endpoints.length} 个端点创建极端化性能数据`);

    // 定义极端化的性能分类
    const performanceProfiles = [
      {
        name: '超高性能端点',
        ratio: 0.6, // 60% 的端点表现优秀
        responseTimeRange: [1, 8], // 1-8ms 超快响应
        successRate: [0.98, 0.995], // 98-99.5% 成功率
        endpoints: ['app-realtime-recognition', 'crossborder-realtime', 'sdk-versions', 'app-library-query']
      },
      {
        name: '高性能端点', 
        ratio: 0.25, // 25% 的端点表现良好
        responseTimeRange: [8, 15], // 8-15ms 快速响应
        successRate: [0.95, 0.98], // 95-98% 成功率
        endpoints: ['app-rules-crud', 'traffic-dyeing-dye', 'watermark-embed']
      },
      {
        name: '问题端点',
        ratio: 0.15, // 15% 的端点有问题
        responseTimeRange: [200, 2000], // 200ms-2s 慢响应
        successRate: [0.15, 0.35], // 15-35% 成功率 (极低)
        endpoints: ['app-ai-predict', 'watermark-compliance-report', 'customization-disaster-recovery']
      }
    ];

    const callsToCreate = [];
    const now = new Date();
    const hoursBack = 24; // 创建过去24小时的数据

    // 为每个端点生成数据
    for (const endpoint of endpoints) {
      // 确定这个端点的性能分类
      let profile = performanceProfiles[2]; // 默认问题端点
      
      for (const p of performanceProfiles) {
        if (p.endpoints.includes(endpoint.id)) {
          profile = p;
          break;
        }
      }
      
      // 如果端点不在特定列表中，随机分配性能分类
      if (!performanceProfiles.some(p => p.endpoints.includes(endpoint.id))) {
        const rand = Math.random();
        if (rand < 0.6) profile = performanceProfiles[0]; // 60% 超高性能
        else if (rand < 0.85) profile = performanceProfiles[1]; // 25% 高性能  
        else profile = performanceProfiles[2]; // 15% 问题端点
      }

      console.log(`📈 ${endpoint.name} -> ${profile.name}`);

      // 为这个端点生成调用记录
      const callsPerEndpoint = Math.floor(Math.random() * 200) + 100; // 100-300次调用

      for (let i = 0; i < callsPerEndpoint; i++) {
        const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        const randomTime = new Date(now.getTime() - Math.random() * hoursBack * 60 * 60 * 1000);
        
        // 根据性能分类生成数据
        const successRoll = Math.random();
        const isSuccess = successRoll < (profile.successRate[0] + Math.random() * (profile.successRate[1] - profile.successRate[0]));
        
        const responseTime = Math.floor(
          profile.responseTimeRange[0] + 
          Math.random() * (profile.responseTimeRange[1] - profile.responseTimeRange[0])
        );

        callsToCreate.push({
          apiKeyId: randomApiKey!.id,
          endpointId: endpoint.id,
          method: endpoint.method,
          endpoint: endpoint.endpoint,
          parameters: JSON.stringify({
            testParam: 'optimized-data',
            timestamp: randomTime.toISOString()
          }),
          response: JSON.stringify({
            code: isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 400),
            msg: isSuccess ? 'success' : (Math.random() > 0.5 ? 'server_error' : 'bad_request'),
            data: isSuccess ? { 
              result: 'ok',
              responseTime: responseTime,
              endpoint: endpoint.name 
            } : null
          }),
          statusCode: isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 400),
          responseTime: responseTime,
          success: isSuccess,
          userAgent: `OptimizedClient/1.0 (${profile.name})`,
          clientIp: `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 200) + 10}`,
          createdAt: randomTime,
        });
      }
    }

    console.log(`📝 准备创建 ${callsToCreate.length} 条API调用记录...`);

    // 分批创建数据（避免一次性插入过多数据）
    const batchSize = 500;
    for (let i = 0; i < callsToCreate.length; i += batchSize) {
      const batch = callsToCreate.slice(i, i + batchSize);
      await prisma.apiCall.createMany({
        data: batch,
      });
      console.log(`✅ 已创建 ${Math.min(i + batchSize, callsToCreate.length)}/${callsToCreate.length} 条记录`);
    }

    // 统计结果
    const totalCalls = await prisma.apiCall.count();
    const successfulCalls = await prisma.apiCall.count({ where: { success: true } });
    const avgResponseTime = await prisma.apiCall.aggregate({
      _avg: { responseTime: true }
    });

    console.log('');
    console.log('📊 极端化性能数据统计:');
    console.log(`├─ 总调用次数: ${totalCalls}`);
    console.log(`├─ 成功调用: ${successfulCalls} (${((successfulCalls/totalCalls)*100).toFixed(1)}%)`);
    console.log(`├─ 平均响应时间: ${Math.round(avgResponseTime._avg.responseTime || 0)}ms`);
    console.log('├─ 性能分布:');
    console.log('│  ├─ 60% 超高性能端点: 1-8ms, 98-99.5% 成功率 🚀');
    console.log('│  ├─ 25% 高性能端点: 8-15ms, 95-98% 成功率 ✅');
    console.log('│  └─ 15% 问题端点: 200ms-2s, 15-35% 成功率 ⚠️');
    console.log('└─ 数据已优化为极端化展示效果！');

  } catch (error) {
    console.error('❌ 创建优化API调用数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createOptimizedApiCallsData()
  .then(() => {
    console.log('✅ 优化API调用数据种子脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 优化API调用数据种子脚本执行失败:', error);
    process.exit(1);
  });

export default createOptimizedApiCallsData;
