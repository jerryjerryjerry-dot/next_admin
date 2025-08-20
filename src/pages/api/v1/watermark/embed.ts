import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createWatermarkTask } from '~/lib/watermark-config';

// 禁用默认的body解析器
export const config = {
  api: {
    bodyParser: false,
  },
};

interface WatermarkEmbedResponse {
  code: number;
  message?: string;
  data?: {
    watermarkId: string;
    fileHash: string;
    embedResult: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WatermarkEmbedResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('📝 文件水印实时嵌入API调用');

    // 确保上传目录存在
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 配置formidable
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `watermark_${timestamp}_${randomStr}${ext}`;
      },
      filter: (part) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        return part.mimetype ? allowedTypes.includes(part.mimetype) : false;
      }
    });

    // 解析表单数据
    const [fields, files] = await form.parse(req);
    
    console.log('📋 解析到的字段:', Object.keys(fields));
    console.log('📁 解析到的文件:', Object.keys(files));

    // 检查必需参数
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const policyId = Array.isArray(fields.policyId) ? fields.policyId[0] : fields.policyId;
    const metaStr = Array.isArray(fields.meta) ? fields.meta[0] : fields.meta;

    if (!file) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: file'
      });
    }

    if (!policyId) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: policyId'
      });
    }

    // 解析meta信息
    let meta = {};
    if (metaStr) {
      try {
        meta = JSON.parse(metaStr);
      } catch (e) {
        console.warn('meta参数解析失败，使用默认值');
      }
    }

    // 计算文件哈希
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    console.log('📊 文件信息:', {
      originalName: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      hash: fileHash.substring(0, 16) + '...'
    });

    // 构造文件URL（本地开发环境）
    const fileName = path.basename(file.filepath);
    const fileUrl = `http://localhost:3000/uploads/${fileName}`;

    // 获取策略信息（从策略管理API）
    const policyResponse = await fetch(`http://localhost:3000/api/watermark/policies`);
    const policyResult = await policyResponse.json() as { success: boolean; data: any[] };
    
    let selectedPolicy = null;
    if (policyResult.success) {
      selectedPolicy = policyResult.data.find(p => p.id === policyId);
    }

    if (!selectedPolicy) {
      return res.status(400).json({
        code: 400,
        error: `策略ID ${policyId} 不存在`
      });
    }

    console.log('🎯 使用策略:', {
      id: selectedPolicy.id,
      name: selectedPolicy.name,
      watermarkText: selectedPolicy.watermarkText
    });

    // 调用外部水印服务
    const watermarkResult = await createWatermarkTask(
      fileUrl,
      selectedPolicy.watermarkText,
      `embed_v1_${Date.now()}`
    );

    // 生成水印ID
    const watermarkId = `wm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 构造响应数据
    const responseData = {
      watermarkId: watermarkId,
      fileHash: fileHash,
      embedResult: watermarkResult.data || 'processing'
    };

    console.log('✅ 水印嵌入任务创建成功:', {
      watermarkId: responseData.watermarkId,
      taskId: watermarkResult.data,
      policyId: policyId,
      meta: meta
    });

    res.status(200).json({
      code: 200,
      message: '水印嵌入任务创建成功',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 文件水印嵌入失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '文件水印嵌入失败'
    });
  }
}
