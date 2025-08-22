import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 禁用Next.js默认的body解析器，因为我们要处理multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResponse {
  success: boolean;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadTime?: string;
  fileHash?: string;
  error?: string;
}

// 计算文件hash
function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// 生成安全的文件名
function generateSafeFileName(originalName: string, hash: string): string {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  return `${timestamp}_${hash.substring(0, 8)}_${safeName}${ext}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST请求'
    });
  }

  const startTime = Date.now();
  console.log('\n📁 [API调用] POST /api/watermark/upload (本地存储)');

  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'watermark', 'original');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB限制
      uploadDir: uploadDir,
      keepExtensions: true,
      filter: (part) => {
        // 文件类型验证
        const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i;
        const fileName = part.originalFilename ?? '';
        
        if (!allowedExtensions.test(fileName)) {
          console.log('❌ 文件扩展名不支持:', fileName);
          return false;
        }
        return true;
      }
    });

    const [fields, files] = await form.parse(req);

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    if (!file || !file.filepath) {
      return res.status(400).json({
        success: false,
        message: '文件解析失败'
      });
    }

    // 计算文件hash
    const fileHash = calculateFileHash(file.filepath);
    
    // 生成安全的文件名
    const safeFileName = generateSafeFileName(
      file.originalFilename || 'upload.bin',
      fileHash
    );

    // 目标文件路径
    const targetPath = path.join(uploadDir, safeFileName);
    
    // 移动文件到目标位置
    fs.renameSync(file.filepath, targetPath);

    // 生成访问URL
    const fileUrl = `/uploads/watermark/original/${safeFileName}`;
    const fullUrl = `${req.headers.origin || 'http://localhost:3000'}${fileUrl}`;

    console.log(`📁 文件保存成功:`, {
      原始名称: file.originalFilename,
      保存名称: safeFileName,
      文件大小: file.size,
      文件hash: fileHash,
      访问URL: fullUrl
    });

    const responseData: UploadResponse = {
      success: true,
      message: '文件上传成功',
      fileUrl: fullUrl,
      fileName: file.originalFilename || safeFileName,
      fileSize: file.size || 0,
      uploadTime: new Date().toISOString(),
      fileHash: fileHash
    };

    console.log('📤 上传响应:', responseData);
    console.log('⏱️ 上传耗时:', `${Date.now() - startTime}ms\n`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ 文件上传失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    let userFriendlyMessage = '文件上传失败';

    if (errorMessage.includes('maxFileSize')) {
      userFriendlyMessage = '文件大小超过50MB限制';
    } else if (errorMessage.includes('ENOENT')) {
      userFriendlyMessage = '上传目录不存在或无权限';
    } else if (errorMessage.includes('ENOSPC')) {
      userFriendlyMessage = '磁盘空间不足';
    } else if (errorMessage.includes('filter rejected')) {
      userFriendlyMessage = '不支持的文件类型';
    }

    const errorResponse: UploadResponse = {
      success: false,
      message: userFriendlyMessage,
      error: errorMessage
    };

    console.log('📤 错误响应:', errorResponse);
    console.log('⏱️ 错误处理耗时:', `${Date.now() - startTime}ms\n`);

    res.status(500).json(errorResponse);
  }
}