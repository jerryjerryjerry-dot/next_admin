import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import FormData from 'form-data';
import { VERCEL_UPLOAD_CONFIG } from '~/lib/watermark-config';
import fetch from 'node-fetch';
import fs from 'fs';

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
  error?: string;
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
  console.log('\n📁 [API调用] POST /api/watermark/upload - 转发到Vercel');
  console.log('🎯 目标Vercel服务:', VERCEL_UPLOAD_CONFIG.uploadUrl);

  try {
    // 配置formidable (不保存到本地，用于验证和转发)
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB限制
      filter: (part) => {
        // 文件类型验证
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];

        const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i;

        const fileName = part.originalFilename ?? '';
        const mimeType = part.mimetype ?? '';
        
        console.log('📋 文件验证:', {
          fileName,
          mimeType
        });

        if (!allowedExtensions.test(fileName)) {
          console.log('❌ 文件扩展名不支持:', fileName);
          return false;
        }

        if (mimeType && !allowedTypes.includes(mimeType)) {
          console.log('❌ 文件MIME类型不支持:', mimeType);
          return false;
        }

        return true;
      }
    });

    const [fields, files] = await form.parse(req);
    
    console.log('📋 解析结果:', {
      fieldsCount: Object.keys(fields).length,
      filesCount: Object.keys(files).length
    });

    // 检查是否有文件上传
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      console.log('❌ 错误: 没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    
    if (!file || !file.filepath) {
      console.log('❌ 错误: 文件对象无效');
      return res.status(400).json({
        success: false,
        message: '文件上传失败'
      });
    }

    console.log('📋 文件详情:', {
      originalFilename: file.originalFilename,
      filepath: file.filepath,
      size: file.size,
      mimetype: file.mimetype
    });

    // 创建新的FormData转发到Vercel
    console.log('🚀 转发文件到Vercel服务...');
    const forwardForm = new FormData();
    
    // 读取文件并添加到新的FormData
    const fileStream = fs.createReadStream(file.filepath);
    forwardForm.append('file', fileStream, {
      filename: file.originalFilename || 'upload',
      contentType: file.mimetype || 'application/octet-stream'
    });

    // 转发到Vercel服务
    const vercelResponse = await fetch(VERCEL_UPLOAD_CONFIG.uploadUrl, {
      method: 'POST',
      body: forwardForm,
      headers: forwardForm.getHeaders()
    });

    console.log(`📋 Vercel响应状态: ${vercelResponse.status}`);
    
    if (!vercelResponse.ok) {
      const errorText = await vercelResponse.text();
      console.log('❌ Vercel上传失败:', errorText);
      
      // 清理临时文件
      try {
        fs.unlinkSync(file.filepath);
      } catch (cleanupError) {
        console.log('⚠️ 清理临时文件失败:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: '文件上传到Vercel服务失败'
      });
    }

    const vercelResult = await vercelResponse.json();
    console.log('📋 Vercel响应数据:', vercelResult);

    // 清理本地临时文件
    try {
      fs.unlinkSync(file.filepath);
      console.log('🗑️ 已清理临时文件');
    } catch (cleanupError) {
      console.log('⚠️ 清理临时文件失败:', cleanupError);
    }

    // 构建响应，使用Vercel返回的URL
    const fileUrl = vercelResult.url || vercelResult.fileUrl || vercelResult.data?.url;
    
    if (!fileUrl) {
      console.log('❌ Vercel未返回有效的文件URL');
      return res.status(500).json({
        success: false,
        message: 'Vercel服务未返回有效的文件URL'
      });
    }

    const result: UploadResponse = {
      success: true,
      message: '文件上传成功',
      fileUrl: fileUrl,
      fileName: file.originalFilename ?? 'unknown',
      fileSize: file.size,
      uploadTime: new Date().toISOString()
    };

    console.log('✅ 文件上传成功!');
    console.log(`📁 Vercel文件URL: ${fileUrl}`);
    console.log('📤 最终响应:', result);
    console.log('⏱️ 总耗时:', `${Date.now() - startTime}ms\n`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ 文件上传失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    let userFriendlyMessage = '文件上传失败';
    
    // 提供用户友好的错误消息
    if (errorMessage.includes('maxFileSize')) {
      userFriendlyMessage = '文件大小超过50MB限制';
    } else if (errorMessage.includes('ENOENT')) {
      userFriendlyMessage = '文件处理失败';
    } else if (errorMessage.includes('EMFILE') || errorMessage.includes('ENFILE')) {
      userFriendlyMessage = '服务器资源不足，请稍后重试';
    } else if (errorMessage.includes('filter rejected')) {
      userFriendlyMessage = '不支持的文件类型';
    }
    
    console.log('⏱️ 失败耗时:', `${Date.now() - startTime}ms\n`);
    
    res.status(500).json({
      success: false,
      message: userFriendlyMessage,
      error: errorMessage
    });
  }
}