import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 工具函数：生成访问密钥对
function generateAccessKeyPair() {
  const accessKeyId = `AK${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  const accessKeySecret = crypto.randomBytes(32).toString('hex');
  return { accessKeyId, accessKeySecret };
}

// 工具函数：加密密钥
function encryptSecret(secret: string) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY ?? 'default-secret-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

async function createMoreTestKeys() {
  console.log('🔑 创建更多展示用测试密钥...');

  try {
    // 获取测试用户
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-user@example.com' }
    });

    if (!testUser) {
      throw new Error('测试用户不存在，请先运行基础密钥种子脚本');
    }

    // 创建更多不同状态和用途的密钥用于展示
    const additionalKeys = [
      {
        keyName: '生产环境-主密钥',
        purpose: '生产环境主要业务API调用密钥，拥有完整权限',
        permissions: [
          'sdk-api:configs', 'sdk-api:versions', 'sdk-api:audit/logs', 'sdk-api:watermark/algorithms',
          'app-recognition:rules', 'app-recognition:realtime', 'app-recognition:encrypted', 'app-recognition:ai/predict', 'app-recognition:abnormal/stat',
          'crossborder:rules', 'crossborder:realtime', 'crossborder:strategy/status', 'crossborder:proxy/identify',
          'customization:status', 'customization:module/load', 'customization:disaster-recovery/status',
          'external:connection/status', 'external:capability/registered', 'external:statistics'
        ],
        quotaLimit: 50000,
        quotaUsed: 12543,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
        status: 'active',
      },
      {
        keyName: '开发环境-调试密钥',
        purpose: '开发团队日常测试和调试使用的密钥',
        permissions: [
          'sdk-api:versions', 'sdk-api:audit/logs',
          'app-recognition:rules', 'app-recognition:realtime',
          'crossborder:rules', 'crossborder:realtime',
          'customization:status',
          'external:statistics'
        ],
        quotaLimit: 5000,
        quotaUsed: 856,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后过期
        status: 'active',
      },
      {
        keyName: '第三方合作-腾讯云',
        purpose: '腾讯云合作伙伴专用API密钥，限制部分功能',
        permissions: [
          'app-recognition:realtime',
          'crossborder:realtime',
          'external:statistics'
        ],
        quotaLimit: 10000,
        quotaUsed: 3241,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180天后过期
        status: 'active',
      },
      {
        keyName: '临时密钥-客户演示',
        purpose: '客户演示会议专用临时密钥，功能受限',
        permissions: [
          'sdk-api:versions',
          'app-recognition:rules',
          'external:capability/registered'
        ],
        quotaLimit: 100,
        quotaUsed: 23,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        status: 'active',
      },
      {
        keyName: '运维监控-告警系统',
        purpose: '运维团队监控系统专用密钥，只读权限',
        permissions: [
          'customization:status',
          'customization:module/load',
          'external:connection/status',
          'external:statistics'
        ],
        quotaLimit: 50000,
        quotaUsed: 18934,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        keyName: '移动端SDK-用户版',
        purpose: '移动端SDK集成专用密钥，限制高级功能',
        permissions: [
          'sdk-api:versions',
          'app-recognition:realtime',
          'crossborder:realtime'
        ],
        quotaLimit: 20000,
        quotaUsed: 15420,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        keyName: '数据分析-BI团队',
        purpose: 'BI团队数据分析专用密钥，主要用于统计查询',
        permissions: [
          'sdk-api:audit/logs',
          'app-recognition:abnormal/stat',
          'external:statistics'
        ],
        quotaLimit: 15000,
        quotaUsed: 7329,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        keyName: '安全审计-合规检查',
        purpose: '安全团队合规审计专用密钥',
        permissions: [
          'sdk-api:audit/logs',
          'app-recognition:abnormal/stat',
          'customization:disaster-recovery/status'
        ],
        quotaLimit: 8000,
        quotaUsed: 1247,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        keyName: '已停用-旧版密钥',
        purpose: '旧版本系统密钥，已停用等待清理',
        permissions: ['sdk-api:versions'],
        quotaLimit: 1000,
        quotaUsed: 1000,
        expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前过期
        status: 'inactive',
      },
      {
        keyName: '暂停中-维护密钥',
        purpose: '系统维护期间暂停的密钥',
        permissions: [
          'app-recognition:rules',
          'crossborder:rules'
        ],
        quotaLimit: 5000,
        quotaUsed: 2341,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'suspended',
      }
    ];

    const createdKeys = [];

    for (const keyData of additionalKeys) {
      const { accessKeyId, accessKeySecret } = generateAccessKeyPair();
      const encryptedSecret = encryptSecret(accessKeySecret);

      const apiKey = await prisma.apiKey.create({
        data: {
          keyName: keyData.keyName,
          purpose: keyData.purpose,
          accessKeyId,
          accessKeySecret: encryptedSecret,
          permissions: JSON.stringify(keyData.permissions),
          quotaLimit: keyData.quotaLimit,
          quotaUsed: keyData.quotaUsed,
          expiresAt: keyData.expiresAt,
          userId: testUser.id,
          status: keyData.status as 'active' | 'inactive' | 'suspended',
        },
      });

      createdKeys.push({
        ...apiKey,
        permissionCount: keyData.permissions.length,
      });

      const statusEmoji = {
        'active': '🟢',
        'inactive': '🔴',
        'suspended': '🟡'
      }[keyData.status] || '⚪';

      console.log(`✅ 创建密钥: ${keyData.keyName}`);
      console.log(`   ${statusEmoji} 状态: ${keyData.status}`);
      console.log(`   🔑 AccessKey: ${accessKeyId}`);
      console.log(`   📊 配额: ${keyData.quotaUsed}/${keyData.quotaLimit}`);
      console.log(`   🔐 权限: ${keyData.permissions.length}个`);
      console.log('');
    }

    console.log('🎉 展示用测试密钥创建完成!');
    console.log('');
    console.log('📊 密钥统计:');
    console.log(`├─ 总密钥数: ${createdKeys.length}`);
    console.log(`├─ 激活状态: ${createdKeys.filter(k => k.status === 'active').length}`);
    console.log(`├─ 停用状态: ${createdKeys.filter(k => k.status === 'inactive').length}`);
    console.log(`└─ 暂停状态: ${createdKeys.filter(k => k.status === 'suspended').length}`);
    console.log('');
    console.log('🔍 现在密钥管理页面将展示丰富的真实数据!');

    return createdKeys;

  } catch (error) {
    console.error('❌ 创建展示密钥失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createMoreTestKeys()
  .then(() => {
    console.log('✅ 展示密钥种子脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 展示密钥种子脚本执行失败:', error);
    process.exit(1);
  });
