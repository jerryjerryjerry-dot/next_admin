import type { NextApiRequest, NextApiResponse } from 'next';

interface PathEntry {
  timestamp: string;
  device: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'server';
    os: string;
    browser?: string;
    ipAddress: string;
    location?: {
      country: string;
      city: string;
      coordinates?: [number, number];
    };
  };
  user: {
    userId: string;
    username: string;
    department: string;
    role: string;
  };
  operation: {
    type: 'create' | 'view' | 'edit' | 'copy' | 'print' | 'download' | 'share' | 'delete';
    description: string;
    duration?: number; // 操作持续时间（秒）
    result: 'success' | 'failed' | 'blocked';
  };
  riskLevel: 'low' | 'medium' | 'high';
}

interface WatermarkPathRequest {
  watermarkId: string;
}

interface WatermarkPathResponse {
  code: number;
  message?: string;
  data?: {
    path: PathEntry[];
    currentHolder: string;
    totalOperations: number;
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high';
      riskFactors: string[];
      recommendations: string[];
    };
  };
  error?: string;
}

// 生成模拟的流转路径数据
function generateMockPath(watermarkId: string): PathEntry[] {
  const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7天前开始
  const operations: PathEntry['operation']['type'][] = ['create', 'view', 'edit', 'copy', 'print', 'download', 'share'];
  const departments = ['技术部', '市场部', '财务部', '人事部', '法务部'];
  const roles = ['员工', '主管', '经理', '总监'];
  const devices = [
    { type: 'desktop' as const, os: 'Windows 11', browser: 'Chrome 120' },
    { type: 'desktop' as const, os: 'macOS 14', browser: 'Safari 17' },
    { type: 'mobile' as const, os: 'iOS 17', browser: 'Safari Mobile' },
    { type: 'mobile' as const, os: 'Android 14', browser: 'Chrome Mobile' },
    { type: 'tablet' as const, os: 'iPadOS 17', browser: 'Safari' }
  ];
  const locations = [
    { country: '中国', city: '北京', coordinates: [116.4074, 39.9042] as [number, number] },
    { country: '中国', city: '上海', coordinates: [121.4737, 31.2304] as [number, number] },
    { country: '中国', city: '深圳', coordinates: [114.0579, 22.5431] as [number, number] },
    { country: '中国', city: '杭州', coordinates: [120.1551, 30.2741] as [number, number] }
  ];

  const path: PathEntry[] = [];
  const numOperations = Math.floor(Math.random() * 15) + 5; // 5-20个操作

  for (let i = 0; i < numOperations; i++) {
    const timestamp = new Date(baseTime + (i * Math.random() * 24 * 60 * 60 * 1000)).toISOString();
    const device = devices[Math.floor(Math.random() * devices.length)]!;
    const location = locations[Math.floor(Math.random() * locations.length)]!;
    const department = departments[Math.floor(Math.random() * departments.length)]!;
    const role = roles[Math.floor(Math.random() * roles.length)]!;
    const operationType = operations[Math.floor(Math.random() * operations.length)]!;

    // 根据操作类型确定风险级别
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (['copy', 'print', 'download', 'share'].includes(operationType)) {
      riskLevel = Math.random() > 0.7 ? 'high' : 'medium';
    } else if (['edit', 'delete'].includes(operationType)) {
      riskLevel = Math.random() > 0.5 ? 'medium' : 'low';
    }

    const entry: PathEntry = {
      timestamp,
      device: {
        deviceId: `device_${Math.random().toString(36).substring(2, 10)}`,
        deviceName: `${device.os.split(' ')[0]} ${device.type}`,
        deviceType: device.type,
        os: device.os,
        browser: device.browser,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location
      },
      user: {
        userId: `user_${Math.random().toString(36).substring(2, 8)}`,
        username: `用户${i + 1}`,
        department,
        role
      },
      operation: {
        type: operationType,
        description: getOperationDescription(operationType),
        duration: operationType === 'view' ? Math.floor(Math.random() * 300) + 10 : undefined,
        result: Math.random() > 0.95 ? 'failed' : (Math.random() > 0.98 ? 'blocked' : 'success')
      },
      riskLevel
    };

    path.push(entry);
  }

  // 按时间排序
  path.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return path;
}

function getOperationDescription(type: PathEntry['operation']['type']): string {
  const descriptions = {
    create: '创建文档并嵌入水印',
    view: '查看文档内容',
    edit: '编辑文档内容',
    copy: '复制文档内容',
    print: '打印文档',
    download: '下载文档到本地',
    share: '分享文档给其他用户',
    delete: '删除文档'
  };
  return descriptions[type];
}

function assessRisk(path: PathEntry[]): {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
} {
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // 分析高风险操作
  const highRiskOps = path.filter(p => p.riskLevel === 'high').length;
  const copyOps = path.filter(p => p.operation.type === 'copy').length;
  const printOps = path.filter(p => p.operation.type === 'print').length;
  const shareOps = path.filter(p => p.operation.type === 'share').length;
  const failedOps = path.filter(p => p.operation.result === 'failed').length;
  const uniqueDevices = new Set(path.map(p => p.device.deviceId)).size;
  const uniqueUsers = new Set(path.map(p => p.user.userId)).size;

  // 风险因子分析
  if (highRiskOps > 3) {
    riskFactors.push(`检测到${highRiskOps}次高风险操作`);
  }
  if (copyOps > 2) {
    riskFactors.push(`文档被复制${copyOps}次，存在泄露风险`);
  }
  if (printOps > 1) {
    riskFactors.push(`文档被打印${printOps}次，需要关注纸质版流向`);
  }
  if (shareOps > 2) {
    riskFactors.push(`文档被分享${shareOps}次，传播范围较广`);
  }
  if (failedOps > 0) {
    riskFactors.push(`发现${failedOps}次异常操作尝试`);
  }
  if (uniqueDevices > 5) {
    riskFactors.push(`文档在${uniqueDevices}台设备上被访问`);
  }
  if (uniqueUsers > 5) {
    riskFactors.push(`${uniqueUsers}个不同用户访问过该文档`);
  }

  // 生成建议
  if (copyOps > 2) {
    recommendations.push('建议加强复制操作的审批流程');
  }
  if (printOps > 1) {
    recommendations.push('建议对打印操作进行额外的权限控制');
  }
  if (shareOps > 2) {
    recommendations.push('建议限制文档的分享权限');
  }
  if (uniqueDevices > 5) {
    recommendations.push('建议对设备访问进行白名单管理');
  }
  if (failedOps > 0) {
    recommendations.push('建议调查异常操作尝试的原因');
  }

  // 综合风险评级
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (riskFactors.length > 4 || highRiskOps > 5) {
    overallRisk = 'high';
  } else if (riskFactors.length > 2 || highRiskOps > 2) {
    overallRisk = 'medium';
  }

  if (recommendations.length === 0) {
    recommendations.push('当前文档流转路径相对安全，建议继续监控');
  }

  return { overallRisk, riskFactors, recommendations };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WatermarkPathResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('🛤️ 水印流转路径查询API调用');

    const { watermarkId } = req.body as WatermarkPathRequest;

    // 参数验证
    if (!watermarkId) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: watermarkId'
      });
    }

    console.log('📋 查询参数:', { watermarkId });

    // 生成模拟的流转路径数据
    const path = generateMockPath(watermarkId);
    
    // 确定当前持有者（最后一次操作的用户）
    const lastOperation = path[path.length - 1];
    const currentHolder = lastOperation ? 
      `${lastOperation.user.username} (${lastOperation.user.department})` : 
      '未知';

    // 风险评估
    const riskAssessment = assessRisk(path);

    const responseData = {
      path,
      currentHolder,
      totalOperations: path.length,
      riskAssessment
    };

    console.log('✅ 流转路径查询成功:', {
      watermarkId,
      totalOperations: path.length,
      currentHolder,
      overallRisk: riskAssessment.overallRisk,
      riskFactors: riskAssessment.riskFactors.length
    });

    res.status(200).json({
      code: 200,
      message: '流转路径查询成功',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 流转路径查询失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '流转路径查询失败'
    });
  }
}
