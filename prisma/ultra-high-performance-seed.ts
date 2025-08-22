import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUltraHighPerformanceData() {
  console.log('🚀 创建超高性能API调用数据 (98%+ 成功率)...');

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

    console.log(`📊 将为 ${endpoints.length} 个端点创建超高性能数据`);

    // 超高性能端点配置 (98%+ 成功率)
    const ultraHighPerformanceEndpoints = [
      'app-realtime-recognition',
      'crossborder-realtime', 
      'sdk-versions',
      'app-library-query',
      'traffic-dyeing-dye',
      'watermark-extract',
      'watermark-trace-path',
      'sdk-configs-crud',
      'external-capability-registered'
    ];

    // 高性能端点配置 (95-98% 成功率)
    const highPerformanceEndpoints = [
      'app-rules-crud',
      'crossborder-rules-crud',
      'app-library-entries-crud',
      'watermark-embed',
      'customization-status'
    ];

    const callsToCreate = [];
    const now = new Date();
    const hoursBack = 24; // 创建过去24小时的数据

    // 为每个端点生成数据
    for (const endpoint of endpoints) {
      let successRate: number;
      let responseTimeRange: [number, number];
      
      if (ultraHighPerformanceEndpoints.includes(endpoint.id)) {
        // 超高性能: 98.5% - 99.8% 成功率, 1-5ms响应
        successRate = 0.985 + Math.random() * 0.013; // 98.5% - 99.8%
        responseTimeRange = [1, 5];
        console.log(`🚀 ${endpoint.name} -> 超高性能 (${(successRate*100).toFixed(1)}%)`);
      } else if (highPerformanceEndpoints.includes(endpoint.id)) {
        // 高性能: 95% - 98% 成功率, 5-12ms响应
        successRate = 0.95 + Math.random() * 0.03; // 95% - 98%
        responseTimeRange = [5, 12];
        console.log(`✅ ${endpoint.name} -> 高性能 (${(successRate*100).toFixed(1)}%)`);
      } else {
        // 其他端点也保持高性能: 92% - 96% 成功率, 8-20ms响应
        successRate = 0.92 + Math.random() * 0.04; // 92% - 96%
        responseTimeRange = [8, 20];
        console.log(`📈 ${endpoint.name} -> 标准性能 (${(successRate*100).toFixed(1)}%)`);
      }

      // 为这个端点生成调用记录
      const callsPerEndpoint = Math.floor(Math.random() * 300) + 200; // 200-500次调用

      for (let i = 0; i < callsPerEndpoint; i++) {
        const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        const randomTime = new Date(now.getTime() - Math.random() * hoursBack * 60 * 60 * 1000);
        
        // 根据成功率生成结果
        const isSuccess = Math.random() < successRate;
        
        const responseTime = Math.floor(
          responseTimeRange[0] + 
          Math.random() * (responseTimeRange[1] - responseTimeRange[0])
        );

        callsToCreate.push({
          apiKeyId: randomApiKey!.id,
          endpointId: endpoint.id,
          method: endpoint.method,
          endpoint: endpoint.endpoint,
          parameters: JSON.stringify({
            testParam: 'ultra-high-performance',
            timestamp: randomTime.toISOString(),
            performance: ultraHighPerformanceEndpoints.includes(endpoint.id) ? 'ultra' : 'high'
          }),
          response: JSON.stringify({
            code: isSuccess ? 200 : (Math.random() > 0.7 ? 500 : 400),
            msg: isSuccess ? 'success' : (Math.random() > 0.7 ? 'server_error' : 'bad_request'),
            data: isSuccess ? { 
              result: 'ok',
              responseTime: responseTime,
              endpoint: endpoint.name,
              performance: 'optimized'
            } : null
          }),
          statusCode: isSuccess ? 200 : (Math.random() > 0.7 ? 500 : 400),
          responseTime: responseTime,
          success: isSuccess,
          userAgent: `UltraHighPerformanceClient/2.0 (${endpoint.id})`,
          clientIp: `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 200) + 10}`,
          createdAt: randomTime,
        });
      }
    }

    console.log(`📝 准备创建 ${callsToCreate.length} 条超高性能API调用记录...`);

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

    // 统计超高性能端点
    const ultraHighPerfCalls = await prisma.apiCall.count({
      where: {
        apiEndpoint: {
          id: { in: ultraHighPerformanceEndpoints }
        }
      }
    });

    const ultraHighPerfSuccess = await prisma.apiCall.count({
      where: {
        success: true,
        apiEndpoint: {
          id: { in: ultraHighPerformanceEndpoints }
        }
      }
    });

    console.log('');
    console.log('📊 超高性能数据统计:');
    console.log(`├─ 总调用次数: ${totalCalls}`);
    console.log(`├─ 成功调用: ${successfulCalls} (${((successfulCalls/totalCalls)*100).toFixed(2)}%)`);
    console.log(`├─ 平均响应时间: ${Math.round(avgResponseTime._avg.responseTime || 0)}ms`);
    console.log(`├─ 超高性能端点调用: ${ultraHighPerfCalls}`);
    console.log(`├─ 超高性能成功率: ${((ultraHighPerfSuccess/ultraHighPerfCalls)*100).toFixed(2)}%`);
    console.log('├─ 性能分布:');
    console.log('│  ├─ 超高性能端点: 1-5ms, 98.5-99.8% 成功率 🚀');
    console.log('│  ├─ 高性能端点: 5-12ms, 95-98% 成功率 ✅');
    console.log('│  └─ 标准端点: 8-20ms, 92-96% 成功率 📈');
    console.log('└─ 数据已优化为超高性能展示效果！');

  } catch (error) {
    console.error('❌ 创建超高性能API调用数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createUltraHighPerformanceData()
  .then(() => {
    console.log('✅ 超高性能数据种子脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 超高性能数据种子脚本执行失败:', error);
    process.exit(1);
  });

export default createUltraHighPerformanceData;
