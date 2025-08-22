import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface ExtractRequest {
  fileUrl: string;
}

interface ExtractResponse {
  success: boolean;
  taskId?: string;
  message?: string;
  error?: string;
}

// 生成唯一的任务ID
function generateTaskId(): string {
  return `extract_task_${crypto.randomUUID()}`;
}

// 模拟从文件中提取水印ID（通过文件名或hash匹配）
async function extractWatermarkFromFile(fileUrl: string): Promise<{
  watermarkId?: string;
  content?: string;
  confidence?: number;
}> {
  // 模拟提取时间
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const urlPath = new URL(fileUrl).pathname;
    const filePath = path.join(process.cwd(), 'public', urlPath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    // 计算文件hash
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // 方法1: 通过文件名提取水印ID（如果是processed文件）
    const fileName = path.basename(filePath);
    const watermarkIdMatch = fileName.match(/watermarked_([a-f0-9]{8})/);
    
    if (watermarkIdMatch) {
      const partialWatermarkId = watermarkIdMatch[1];
      console.log(`🔍 从文件名提取到部分水印ID: ${partialWatermarkId}`);
      
      // 在数据库中查找匹配的水印ID（文件名中的8位是水印ID去掉wm_前缀后的前8位）
      const watermarkContent = await db.watermarkContent.findFirst({
        where: {
          watermarkId: {
            startsWith: `wm_${partialWatermarkId}`
          }
        }
      });
      
      if (watermarkContent) {
        console.log(`✅ 通过文件名匹配到水印: ${watermarkContent.watermarkId}`);
        return {
          watermarkId: watermarkContent.watermarkId,
          content: watermarkContent.content,
          confidence: 0.95
        };
      } else {
        console.log(`❌ 未找到匹配的水印ID (前缀: wm_${partialWatermarkId})`);
      }
    }
    
    // 方法2: 通过文件hash匹配
    console.log(`🔍 尝试通过文件hash匹配: ${fileHash.substring(0, 16)}...`);
    const watermarkByHash = await db.watermarkContent.findFirst({
      where: {
        OR: [
          { originalFileHash: fileHash },
          { watermarkFileHash: fileHash }
        ]
      }
    });
    
    if (watermarkByHash) {
      console.log(`✅ 通过hash匹配到水印: ${watermarkByHash.watermarkId}`);
      return {
        watermarkId: watermarkByHash.watermarkId,
        content: watermarkByHash.content,
        confidence: 0.88
      };
    } else {
      console.log(`❌ 未通过hash找到匹配的水印`);
    }
    
    // 如果以上方法都没有找到匹配的水印，返回空结果
    
    return {
      confidence: 0
    };
    
  } catch (error) {
    console.error('提取水印时出错:', error);
    return {
      confidence: 0
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST请求'
    });
  }

  const startTime = Date.now();
  console.log('\n🔍 [API调用] POST /api/watermark/extract (本地处理)');

  try {
    const { fileUrl }: ExtractRequest = req.body as ExtractRequest;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: fileUrl'
      });
    }

    // 生成任务ID
    const taskId = generateTaskId();
    const bizId = `extract_${Date.now()}`;

    console.log('📋 提取参数:', {
      fileUrl,
      taskId
    });

    // 获取文件信息
    const urlPath = new URL(fileUrl).pathname;
    const filePath = path.join(process.cwd(), 'public', urlPath);
    const fileName = path.basename(filePath);
    const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    
    // 计算文件hash
    let fileHash = '';
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // 创建WatermarkRecord记录
    const record = await db.watermarkRecord.create({
      data: {
        fileName: fileName,
        fileSize: fileSize,
        fileHash: fileHash,
        fileUrl: fileUrl,
        operation: 'extract',
        taskId: taskId,
        status: 'processing',
        progress: 0,
        originalFileHash: fileHash,
        createdById: (await db.user.findFirst({ where: { role: 'admin' }, select: { id: true } }))?.id ?? 'unknown'
      }
    });

    console.log('💾 提取记录创建成功:', {
      recordId: record.id
    });

    // 异步处理水印提取
    extractWatermarkFromFile(fileUrl)
      .then(async (extractResult) => {
        if (extractResult.watermarkId && extractResult.content) {
          // 提取成功
          await db.watermarkRecord.update({
            where: { id: record.id },
            data: {
              status: 'completed',
              progress: 100,
              result: extractResult.content,
              watermarkId: extractResult.watermarkId,
              metadata: JSON.stringify({
                confidence: extractResult.confidence,
                extractedWatermarkId: extractResult.watermarkId
              })
            }
          });

          console.log('✅ 水印提取成功:', {
            taskId,
            watermarkId: extractResult.watermarkId,
            content: extractResult.content,
            confidence: extractResult.confidence
          });
        } else {
          // 未找到水印
          await db.watermarkRecord.update({
            where: { id: record.id },
            data: {
              status: 'completed',
              progress: 100,
              result: '未检测到水印',
              metadata: JSON.stringify({
                confidence: 0,
                message: '文件中未找到水印信息'
              })
            }
          });

          console.log('⚠️ 未检测到水印:', { taskId });
        }
      })
      .catch(async (error) => {
        console.error('❌ 水印提取处理失败:', error);
        
        // 更新记录为失败状态
        await db.watermarkRecord.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : '提取失败'
          }
        });
      });

    const responseData: ExtractResponse = {
      success: true,
      taskId: taskId,
      message: '水印提取任务已创建'
    };

    console.log('📤 提取响应:', responseData);
    console.log('⏱️ 提取耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ 水印提取失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorResponse: ExtractResponse = {
      success: false,
      message: '水印提取失败',
      error: errorMessage
    };

    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);

    res.status(500).json(errorResponse);
  }
}