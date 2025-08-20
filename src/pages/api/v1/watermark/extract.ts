import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createExtractWatermarkTask } from '~/lib/watermark-config';

// 禁用默认的body解析器
export const config = {
  api: {
    bodyParser: false,
  },
};

interface WatermarkExtractResponse {
  code: number;
  message?: string;
  data?: {
    watermarkId: string;
    meta: object;
    extractRate: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WatermarkExtractResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('🔍 截图/片段水印提取API调用');

    // 确保上传目录存在
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 配置formidable
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB (片段文件通常较小)
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `extract_${timestamp}_${randomStr}${ext}`;
      },
      filter: (part) => {
        // 支持更多文件类型，包括图片片段
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/bmp',
          'image/tiff',
          'image/webp'
        ];
        
        return part.mimetype ? allowedTypes.includes(part.mimetype) : false;
      }
    });

    // 解析表单数据
    const [fields, files] = await form.parse(req);
    
    console.log('📋 解析到的字段:', Object.keys(fields));
    console.log('📁 解析到的文件:', Object.keys(files));

    // 检查必需参数
    const fileFragment = Array.isArray(files.fileFragment) ? files.fileFragment[0] : files.fileFragment;

    if (!fileFragment) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: fileFragment'
      });
    }

    // 文件信息分析
    const fileBuffer = fs.readFileSync(fileFragment.filepath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    console.log('📊 文件片段信息:', {
      originalName: fileFragment.originalFilename,
      size: fileFragment.size,
      type: fileFragment.mimetype,
      hash: fileHash.substring(0, 16) + '...'
    });

    // 构造文件URL（本地开发环境）
    const fileName = path.basename(fileFragment.filepath);
    const fileUrl = `http://localhost:3000/uploads/${fileName}`;

    // 调用外部水印提取服务
    const extractResult = await createExtractWatermarkTask(
      fileUrl,
      `extract_v1_${Date.now()}`
    );

    // 模拟水印提取分析
    const isImageFile = fileFragment.mimetype?.startsWith('image/');
    const fileSize = fileFragment.size || 0;
    
    // 根据文件类型和大小计算提取成功率
    let extractRate = 0.0;
    let watermarkId = '';
    let extractedMeta = {};

    // 模拟提取逻辑
    if (isImageFile) {
      // 图片文件的提取率通常较高
      extractRate = Math.random() * 0.3 + 0.7; // 70%-100%
      
      if (extractRate > 0.8) {
        watermarkId = `img_wm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        extractedMeta = {
          fileType: 'image',
          originalFormat: fileFragment.mimetype,
          extractMethod: 'visual_analysis',
          confidence: extractRate,
          detectedWatermark: {
            text: '机密文档',
            position: 'center',
            opacity: 0.3,
            color: '#666666'
          },
          deviceInfo: {
            captureTime: new Date().toISOString(),
            resolution: '1920x1080',
            colorDepth: 24
          }
        };
      }
    } else {
      // 文档文件的提取率
      extractRate = Math.random() * 0.4 + 0.5; // 50%-90%
      
      if (extractRate > 0.6) {
        watermarkId = `doc_wm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        extractedMeta = {
          fileType: 'document',
          originalFormat: fileFragment.mimetype,
          extractMethod: 'content_analysis',
          confidence: extractRate,
          detectedWatermark: {
            text: '内部资料',
            embedLevel: 'medium',
            algorithm: 'lsb_text'
          },
          documentInfo: {
            pageCount: Math.floor(Math.random() * 10) + 1,
            wordCount: Math.floor(Math.random() * 1000) + 100,
            lastModified: new Date().toISOString()
          }
        };
      }
    }

    // 如果提取率太低，表示没有检测到水印
    if (extractRate < 0.5) {
      extractRate = 0.0;
      watermarkId = '';
      extractedMeta = {
        fileType: isImageFile ? 'image' : 'document',
        extractMethod: isImageFile ? 'visual_analysis' : 'content_analysis',
        confidence: extractRate,
        result: 'no_watermark_detected',
        reason: '文件中未检测到可识别的水印信息'
      };
    }

    const responseData = {
      watermarkId: watermarkId,
      meta: extractedMeta,
      extractRate: Math.round(extractRate * 1000) / 1000 // 保留3位小数
    };

    console.log('✅ 水印提取分析完成:', {
      fileName: fileFragment.originalFilename,
      extractRate: responseData.extractRate,
      hasWatermark: !!watermarkId,
      taskId: extractResult.data
    });

    res.status(200).json({
      code: 200,
      message: extractRate > 0 ? '水印提取成功' : '未检测到水印',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 水印提取失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '水印提取失败'
    });
  }
}
