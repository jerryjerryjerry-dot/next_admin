// 本地Next.js水印API服务调用
export class WatermarkAPIService {
  private baseUrl = ''; // 使用相对路径调用本地API

  // 上传文件到本地Next.js API
  async uploadFile(file: File): Promise<{
    success: boolean;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    message?: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/watermark/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as {
        success: boolean;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        message?: string;
      };
      
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? '文件上传失败');
      }

      return {
        success: result.success,
        fileUrl: result.fileUrl ?? '',
        fileName: result.fileName ?? '',
        fileSize: result.fileSize ?? 0,
        message: result.message,
      };
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(error instanceof Error ? error.message : '文件上传失败');
    }
  }

  // 嵌入水印
  async embedWatermark(fileUrl: string, content: string, bizId?: string): Promise<{
    success: boolean;
    taskId: string;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/watermark/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
          watermarkText: content,
          bizId: bizId ?? `embed_${Date.now()}`
        }),
      });

      const result = await response.json() as {
        success: boolean;
        taskId?: string;
        message?: string;
      };
      
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? '水印嵌入失败');
      }

      return {
        success: true,
        taskId: result.taskId ?? '',
        message: result.message
      };
    } catch (error) {
      console.error('水印嵌入失败:', error);
      throw new Error(error instanceof Error ? error.message : '水印嵌入失败');
    }
  }

  // 提取水印
  async extractWatermark(fileUrl: string, bizId?: string): Promise<{
    success: boolean;
    taskId: string;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/watermark/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
          bizId: bizId ?? `extract_${Date.now()}`
        }),
      });

      const result = await response.json() as {
        success: boolean;
        taskId?: string;
        message?: string;
      };
      
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? '水印提取失败');
      }

      return {
        success: true,
        taskId: result.taskId ?? '',
        message: result.message
      };
    } catch (error) {
      console.error('水印提取失败:', error);
      throw new Error(error instanceof Error ? error.message : '水印提取失败');
    }
  }

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<{
    success: boolean;
    data: {
      taskId: string;
      status: string;
      progress: number;
      estimatedTime?: string;
      result?: {
        downloadUrl?: string;
        extractedContent?: string;
        confidence?: number;
      };
    };
    message?: string;
  }> {
    try {
      const response = await fetch(`/api/watermark/status/${taskId}`);
      const result = await response.json() as {
        success: boolean;
        taskId?: string;
        status?: string;
        progress?: number;
        estimatedTime?: string;
        result?: any;
        message?: string;
      };
      
      console.log('📋 状态查询API响应:', result);
      console.log('📋 HTTP状态:', response.status, response.ok);
      
      if (!response.ok) {
        console.error('❌ HTTP响应失败:', response.status, result);
        throw new Error(`HTTP ${response.status}: ${result.message ?? '状态查询失败'}`);
      }
      
      if (!result.success) {
        console.error('❌ API返回失败:', result);
        throw new Error(result.message ?? '状态查询失败');
      }
      
      console.log('✅ 状态查询成功:', { 
        taskId: result.taskId, 
        status: result.status, 
        progress: result.progress 
      });

      // 处理结果数据
      const processedResult: {
        downloadUrl?: string;
        extractedContent?: string;
        confidence?: number;
      } = {};

      if (result.result?.data) {
        if (result.status === 'finished') {
          // 如果是嵌入任务，result.data是下载URL
          // 如果是提取任务，result.data是提取的内容
          if (result.result.data.startsWith('http')) {
            processedResult.downloadUrl = result.result.data;
          } else {
            processedResult.extractedContent = result.result.data;
            processedResult.confidence = 0.95; // 默认置信度
          }
        }
      }

      return {
        success: true,
        data: {
          taskId: result.taskId ?? taskId,
          status: result.status ?? 'unknown',
          progress: result.progress ?? 0,
          estimatedTime: result.estimatedTime,
          result: processedResult
        },
        message: result.message,
      };
    } catch (error) {
      console.error('状态查询失败:', error);
      throw new Error(error instanceof Error ? error.message : '状态查询失败');
    }
  }

  // 检查服务健康状态
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/watermark/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('水印服务连接失败:', error);
      return false;
    }
  }
}

// 单例实例
export const watermarkAPI = new WatermarkAPIService();
