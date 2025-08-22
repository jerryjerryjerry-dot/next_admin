import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface EmbedRequest {
  fileUrl: string;
  content: string;
  policyId?: string;
}

interface EmbedResponse {
  success: boolean;
  taskId?: string;
  message?: string;
  error?: string;
}

// 生成唯一的水印ID
function generateWatermarkId(): string {
  return `wm_${crypto.randomUUID().replace(/-/g, '')}`;
}

// 生成唯一的任务ID
function generateTaskId(): string {
  return `task_${crypto.randomUUID()}`;
}

// 模拟文件水印嵌入处理（复制文件并添加后缀）
async function processWatermarkEmbed(
  originalFileUrl: string, 
  watermarkId: string,
  taskId: string
): Promise<string> {
  // 从URL中提取文件路径
  const urlPath = new URL(originalFileUrl).pathname;
  const originalFilePath = path.join(process.cwd(), 'public', urlPath);
  
  // 生成处理后文件路径
  const ext = path.extname(originalFilePath);
  const baseName = path.basename(originalFilePath, ext);
  const processedFileName = `${baseName}_watermarked_${watermarkId.substring(3, 11)}${ext}`;
  const processedDir = path.join(process.cwd(), 'public', 'uploads', 'watermark', 'processed');
  const processedFilePath = path.join(processedDir, processedFileName);
  
  // 确保处理目录存在
  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
  }
  
  // 模拟处理时间（复制文件）
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 复制文件到processed目录（模拟水印嵌入）
  fs.copyFileSync(originalFilePath, processedFilePath);
  
  // 返回处理后文件的URL
  return `/uploads/watermark/processed/${processedFileName}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmbedResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST请求'
    });
  }

  const startTime = Date.now();
  console.log('\n🔒 [API调用] POST /api/watermark/embed (本地处理)');

  try {
    const { fileUrl, content, policyId }: EmbedRequest = req.body as EmbedRequest;

    if (!fileUrl || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: fileUrl 和 content'
      });
    }

    // 如果没有提供策略ID，使用默认策略
    let actualPolicyId = policyId;
    if (!actualPolicyId) {
      const defaultPolicy = await db.watermarkPolicy.findFirst({
        where: { isDefault: true, status: 'active' }
      });
      
      if (defaultPolicy) {
        actualPolicyId = defaultPolicy.id;
        console.log('🔧 使用默认水印策略:', defaultPolicy.name, '(ID:', actualPolicyId, ')');
      } else {
        return res.status(400).json({
          success: false,
          message: '没有找到可用的水印策略，请联系管理员配置'
        });
      }
    }

    // 生成唯一ID
    const watermarkId = generateWatermarkId();
    const taskId = generateTaskId();
    const bizId = `embed_${Date.now()}`;

    console.log('📋 嵌入参数:', {
      fileUrl,
      content,
      watermarkId,
      taskId,
      policyId: actualPolicyId,
      originalPolicyId: policyId
    });

    // 获取文件信息
    const urlPath = new URL(fileUrl).pathname;
    const originalFilePath = path.join(process.cwd(), 'public', urlPath);
    const fileName = path.basename(originalFilePath);
    const fileSize = fs.existsSync(originalFilePath) ? fs.statSync(originalFilePath).size : 0;
    
    // 计算原始文件hash
    let originalFileHash = '';
    if (fs.existsSync(originalFilePath)) {
      const fileBuffer = fs.readFileSync(originalFilePath);
      originalFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // 获取管理员用户ID用于创建记录
    const adminUser = await db.user.findFirst({
      where: { role: 'admin' },
      select: { id: true }
    });
    
    if (!adminUser) {
      return res.status(500).json({
        success: false,
        message: '系统配置错误：未找到管理员用户'
      });
    }

    // 1. 创建WatermarkContent记录
    const watermarkContent = await db.watermarkContent.create({
      data: {
        watermarkId: watermarkId,
        content: content,
        bizId: bizId,
        embedTaskId: taskId,
        originalFileHash: originalFileHash,
        createdById: adminUser.id
      }
    });

    // 2. 创建WatermarkRecord记录
    const record = await db.watermarkRecord.create({
      data: {
        fileName: fileName,
        fileSize: fileSize,
        fileHash: originalFileHash,
        fileUrl: fileUrl,
        operation: 'embed',
        policyId: actualPolicyId,
        watermarkText: content,
        watermarkId: watermarkId,
        taskId: taskId,
        status: 'processing',
        progress: 0,
        originalFileHash: originalFileHash,
        createdById: adminUser.id
      }
    });

    console.log('💾 数据库记录创建成功:', {
      watermarkContentId: watermarkContent.id,
      recordId: record.id
    });

    // 3. 异步处理水印嵌入
    processWatermarkEmbed(fileUrl, watermarkId, taskId)
      .then(async (processedFileUrl) => {
        // 计算处理后文件hash
        const processedFilePath = path.join(process.cwd(), 'public', processedFileUrl);
        const processedFileBuffer = fs.readFileSync(processedFilePath);
        const processedFileHash = crypto.createHash('sha256').update(processedFileBuffer).digest('hex');
        
        const fullProcessedUrl = `${req.headers.origin || 'http://localhost:3000'}${processedFileUrl}`;

        // 更新数据库记录
        await Promise.all([
          db.watermarkContent.update({
            where: { id: watermarkContent.id },
            data: { watermarkFileHash: processedFileHash }
          }),
          db.watermarkRecord.update({
            where: { id: record.id },
            data: {
              status: 'completed',
              progress: 100,
              result: fullProcessedUrl,
              processedFileUrl: fullProcessedUrl,
              processedFileHash: processedFileHash
            }
          })
        ]);

        console.log('✅ 水印嵌入处理完成:', {
          taskId,
          processedUrl: fullProcessedUrl
        });
      })
      .catch(async (error) => {
        console.error('❌ 水印嵌入处理失败:', error);
        
        // 更新记录为失败状态
        await db.watermarkRecord.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : '处理失败'
          }
        });
      });

    const responseData: EmbedResponse = {
      success: true,
      taskId: taskId,
      message: '水印嵌入任务已创建'
    };

    console.log('📤 嵌入响应:', responseData);
    console.log('⏱️ 嵌入耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ 水印嵌入失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorResponse: EmbedResponse = {
      success: false,
      message: '水印嵌入失败',
      error: errorMessage
    };

    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);

    res.status(500).json(errorResponse);
  }
}