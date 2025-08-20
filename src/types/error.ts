// 错误处理类型定义
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (typeof error === 'string') {
    return error;
  }
  return '操作失败，请稍后重试';
}
