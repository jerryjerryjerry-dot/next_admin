import { type UserProfile } from "~/types/user-management";

// 🐼 导出工具函数 - 熊猫科技风格

interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  filename?: string;
  fields?: string[];
}

// 将用户数据转换为导出格式
export function formatUserDataForExport(users: UserProfile[]): Record<string, any>[] {
  return users.map(user => ({
    "用户ID": user.id,
    "用户名": user.username,
    "邮箱": user.email,
    "真实姓名": user.name,
    "角色": user.role === "admin" ? "管理员" : "普通用户",
    "状态": 
      user.status === "active" ? "正常" :
      user.status === "inactive" ? "未激活" : "已暂停",
    "手机号": user.phone || "",
    "部门": user.department || "",
    "职位": user.position || "",
    "个人简介": user.description || "",
    "最后登录时间": user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : "",
    "最后登录IP": user.lastLoginIp || "",
    "登录尝试次数": user.loginAttempts,
    "账户锁定到": user.lockedUntil ? new Date(user.lockedUntil).toLocaleString('zh-CN') : "",
    "邮箱验证时间": user.emailVerified ? new Date(user.emailVerified).toLocaleString('zh-CN') : "",
    "创建时间": new Date(user.createdAt).toLocaleString('zh-CN'),
    "最后更新时间": new Date(user.updatedAt).toLocaleString('zh-CN'),
    "创建者": user.createdBy?.name || ""
  }));
}

// 导出为CSV格式
export function exportToCSV(data: Record<string, any>[], filename: string = '用户数据') {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    // 添加BOM以支持Excel正确显示中文
    '\uFEFF',
    // 表头
    headers.join(','),
    // 数据行
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 处理包含逗号或引号的字段
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// 导出为Excel格式 (实际是CSV，但Excel会自动识别)
export function exportToExcel(data: Record<string, any>[], filename: string = '用户数据') {
  exportToCSV(data, filename);
}

// 导出为JSON格式
export function exportToJSON(data: Record<string, any>[], filename: string = '用户数据') {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

// 下载文件的通用函数
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// 主导出函数
export function exportUserData(users: UserProfile[], options: ExportOptions) {
  const formattedData = formatUserDataForExport(users);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = options.filename || `用户数据_${timestamp}`;

  try {
    switch (options.format) {
      case 'csv':
        exportToCSV(formattedData, filename);
        break;
      case 'excel':
        exportToExcel(formattedData, filename);
        break;
      case 'json':
        exportToJSON(formattedData, filename);
        break;
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  } catch (error) {
    console.error('导出失败:', error);
    throw error;
  }
}

// 导出统计报告
export function exportUserStats(stats: any, filename: string = '用户统计报告') {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const reportData = {
    "报告生成时间": new Date().toLocaleString('zh-CN'),
    "用户统计": {
      "总用户数": stats.totalUsers || 0,
      "活跃用户": stats.activeUsers || 0,
      "未激活用户": stats.inactiveUsers || 0,
      "已暂停用户": stats.suspendedUsers || 0,
      "管理员用户": stats.adminUsers || 0,
      "普通用户": stats.regularUsers || 0,
      "最近登录用户": stats.recentLogins || 0,
      "锁定用户": stats.lockedUsers || 0
    }
  };

  const jsonContent = JSON.stringify(reportData, null, 2);
  downloadFile(jsonContent, `${filename}_${timestamp}.json`, 'application/json;charset=utf-8;');
}
