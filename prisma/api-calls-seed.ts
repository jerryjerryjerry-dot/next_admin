#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedApiCalls() {
  console.log('🔄 开始生成API调用数据...');

  try {
    // 获取现有的API端点和密钥
    const endpoints = await prisma.apiEndpoint.findMany({
      select: { id: true, name: true }
    });

    const apiKeys = await prisma.apiKey.findMany({
      select: { id: true, keyName: true }
    });

    if (endpoints.length === 0) {
      console.log('❌ 没有找到API端点，请先运行api-seed.ts');
      return;
    }

    if (apiKeys.length === 0) {
      console.log('❌ 没有找到API密钥，请先创建一些密钥');
      return;
    }

    console.log(`📊 找到 ${endpoints.length} 个端点和 ${apiKeys.length} 个密钥`);

    // 生成过去24小时的API调用记录
    const calls = [];
    const now = new Date();
    const hoursAgo24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 生成200个API调用记录
    for (let i = 0; i < 200; i++) {
      const randomTime = new Date(
        hoursAgo24.getTime() + Math.random() * (now.getTime() - hoursAgo24.getTime())
      );

      const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      // 85%成功率
      const isSuccess = Math.random() < 0.85;
      
      // 响应时间分布（正常：20-200ms，失败：可能更长）
      const responseTime = isSuccess 
        ? Math.floor(Math.random() * 180) + 20  // 20-200ms
        : Math.floor(Math.random() * 800) + 200; // 200-1000ms

      calls.push({
        apiKeyId: randomApiKey!.id,
        endpointId: randomEndpoint!.id,
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)]!,
        endpoint: `/api/v1/${randomEndpoint!.name?.toLowerCase() ?? 'unknown'}`,
        parameters: isSuccess ? '{"param": "value"}' : null,
        response: isSuccess 
          ? '{"status": "success", "data": {}}' 
          : '{"status": "error", "message": "操作失败"}',
        statusCode: isSuccess ? 200 : [400, 401, 403, 404, 500][Math.floor(Math.random() * 5)]!,
        responseTime,
        success: isSuccess,
        userAgent: 'API-Client/1.0',
        clientIp: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        createdAt: randomTime,
      });
    }

    // 批量插入数据
    console.log('📝 插入API调用记录...');
    
    // 分批插入以避免数据库限制
    const batchSize = 50;
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      await prisma.apiCall.createMany({
        data: batch,
      });
      console.log(`✅ 已插入 ${Math.min(i + batchSize, calls.length)}/${calls.length} 条记录`);
    }

    // 生成统计摘要
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.success).length;
    const avgResponseTime = calls.reduce((sum, c) => sum + c.responseTime, 0) / calls.length;

    console.log('\n📈 生成数据统计:');
    console.log(`   总调用数: ${totalCalls}`);
    console.log(`   成功调用: ${successfulCalls} (${((successfulCalls/totalCalls)*100).toFixed(1)}%)`);
    console.log(`   失败调用: ${totalCalls - successfulCalls}`);
    console.log(`   平均响应时间: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   时间范围: ${hoursAgo24.toLocaleString()} - ${now.toLocaleString()}`);

    console.log('\n🎉 API调用数据生成完成！');
    console.log('💡 现在OpenAPI监控页面将显示真实的动态数据');

  } catch (error) {
    console.error('❌ 生成API调用数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 直接运行此脚本
seedApiCalls();

export default seedApiCalls;
