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
      const response = await fetch('/api/watermark/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
          content,
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
      };
    } catch (error) {
      console.error('水印提取失败:', error);
      throw new Error(error instanceof Error ? error.message : '水印提取失败');
    }
  }

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<{
    success: boolean;
    data: unknown;
    message?: string;
  }> {
    try {
      const response = await fetch(`/api/watermark/task/${taskId}`);
      const result = await response.json() as {
        success: boolean;
        data?: unknown;
        message?: string;
      };
      
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? '状态查询失败');
      }

      return {
        success: result.success,
        data: result.data ?? null,
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
      const response = await fetch('/api/watermark/status', {
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
