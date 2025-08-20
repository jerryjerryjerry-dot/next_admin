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

async function createTestApiKeys() {
  console.log('🔑 开始创建测试API密钥...');

  try {
    // 确保有测试用户
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-user@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'API测试用户',
          email: 'test-user@example.com',
          role: 'admin',
        }
      });
      console.log('✅ 创建测试用户');
    }

    // 清理旧的测试密钥
    await prisma.apiKey.deleteMany({
      where: {
        userId: testUser.id,
        keyName: {
          startsWith: '测试密钥'
        }
      }
    });

    console.log('🧹 清理旧的测试密钥');

    // 创建测试密钥数组
    const testKeys = [
      {
        keyName: '测试密钥-只读权限',
        purpose: '用于测试只读权限API，只能查询基础信息',
        permissions: ['sdk-api:versions', 'app-recognition:rules', 'external:capability/registered'],
        quotaLimit: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      },
      {
        keyName: '测试密钥-标准权限',
        purpose: '用于测试标准权限API，支持常用操作',
        permissions: [
          'sdk-api:configs', 'sdk-api:versions', 'sdk-api:audit/logs',
          'app-recognition:rules', 'app-recognition:realtime',
          'crossborder:rules', 'crossborder:realtime',
          'customization:status', 'customization:module/load',
          'external:connection/status', 'external:capability/registered', 'external:statistics'
        ],
        quotaLimit: 1000,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后过期
      },
      {
        keyName: '测试密钥-管理员权限',
        purpose: '用于测试管理员权限API，拥有完整访问权限',
        permissions: [
          'sdk-api:configs', 'sdk-api:versions', 'sdk-api:audit/logs', 'sdk-api:watermark/algorithms',
          'app-recognition:rules', 'app-recognition:realtime', 'app-recognition:encrypted', 'app-recognition:ai/predict', 'app-recognition:abnormal/stat',
          'crossborder:rules', 'crossborder:realtime', 'crossborder:strategy/status', 'crossborder:proxy/identify',
          'customization:status', 'customization:module/load', 'customization:disaster-recovery/status',
          'external:connection/status', 'external:capability/registered', 'external:statistics'
        ],
        quotaLimit: 10000,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
      },
      {
        keyName: '测试密钥-已过期',
        purpose: '用于测试过期密钥的处理逻辑',
        permissions: ['sdk-api:versions'],
        quotaLimit: 50,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天过期
      },
      {
        keyName: '测试密钥-配额耗尽',
        purpose: '用于测试配额限制功能',
        permissions: ['sdk-api:versions', 'app-recognition:rules'],
        quotaLimit: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        quotaUsed: 10, // 配额已用完
      },
    ];

    const createdKeys = [];

    for (const keyData of testKeys) {
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
          quotaUsed: keyData.quotaUsed || 0,
          expiresAt: keyData.expiresAt,
          userId: testUser.id,
          status: 'active',
        },
      });

      createdKeys.push({
        ...apiKey,
        accessKeySecret, // 保存明文密钥用于测试
        permissionLabels: keyData.permissions,
      });

      console.log(`✅ 创建密钥: ${keyData.keyName}`);
      console.log(`   AccessKey ID: ${accessKeyId}`);
      console.log(`   权限数量: ${keyData.permissions.length}`);
      console.log(`   配额: ${keyData.quotaUsed || 0}/${keyData.quotaLimit}`);
      console.log(`   过期时间: ${keyData.expiresAt.toLocaleDateString()}`);
      console.log('');
    }

    console.log('🎉 测试密钥创建完成!');
    console.log('');
    console.log('📋 测试密钥摘要:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    
    createdKeys.forEach((key, index) => {
      const status = key.expiresAt && new Date() > key.expiresAt ? '已过期' : 
                    key.quotaLimit && key.quotaUsed >= key.quotaLimit ? '配额耗尽' : '正常';
      console.log(`│ ${index + 1}. ${key.keyName.padEnd(20)} │ ${status.padEnd(8)} │ ${key.permissionLabels.length}个权限 │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('🚀 现在可以使用这些密钥测试API功能了！');
    console.log('');
    console.log('💡 建议测试场景:');
    console.log('1. 使用只读权限密钥测试基础查询API');
    console.log('2. 使用标准权限密钥测试常用操作API');
    console.log('3. 使用管理员权限密钥测试所有API');
    console.log('4. 使用过期密钥验证权限控制');
    console.log('5. 使用配额耗尽密钥测试配额限制');

    return createdKeys;

  } catch (error) {
    console.error('❌ 创建测试密钥失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createTestApiKeys()
  .then(() => {
    console.log('✅ 测试密钥种子脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 测试密钥种子脚本执行失败:', error);
    process.exit(1);
  });
