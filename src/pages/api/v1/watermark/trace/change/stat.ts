import type { NextApiRequest, NextApiResponse } from 'next';

interface WatermarkChangeRequest {
  watermarkId: string;
}

interface ChangeRecord {
  changeId: string;
  timestamp: string;
  changeType: 'embed' | 'extract' | 'modify' | 'copy' | 'move' | 'delete' | 'restore' | 'verify';
  description: string;
  user: {
    userId: string;
    username: string;
    department: string;
    role: string;
  };
  device: {
    deviceId: string;
    deviceType: string;
    os: string;
    location: string;
  };
  details: {
    previousState?: string;
    newState?: string;
    parameters?: Record<string, any>;
    fileHash?: string;
    checksum?: string;
  };
  riskScore: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  verified: boolean;
}

interface WatermarkChangeStatResponse {
  code: number;
  message?: string;
  data?: {
    totalChanges: number;
    changeTypes: {
      embed: number;
      extract: number;
      modify: number;
      copy: number;
      move: number;
      delete: number;
      restore: number;
      verify: number;
    };
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timeline: {
      last24h: number;
      last7days: number;
      last30days: number;
      older: number;
    };
    riskAnalysis: {
      averageRiskScore: number;
      highRiskChanges: number;
      unverifiedChanges: number;
      suspiciousPatterns: string[];
    };
    changeHistory: ChangeRecord[];
    integrityStatus: {
      isIntact: boolean;
      lastVerified: string;
      checksumValid: boolean;
      tamperedSigns: string[];
    };
  };
  error?: string;
}

// 生成模拟的变更记录
function generateMockChangeRecords(watermarkId: string): ChangeRecord[] {
  const changes: ChangeRecord[] = [];
  const changeTypes = ['embed', 'extract', 'modify', 'copy', 'move', 'delete', 'restore', 'verify'] as const;
  const departments = ['技术部', '市场部', '财务部', '人事部', '法务部'];
  const roles = ['员工', '主管', '经理', '总监', '系统管理员'];
  const deviceTypes = ['desktop', 'mobile', 'tablet', 'server'];
  const locations = ['北京', '上海', '深圳', '杭州', '广州'];
  const operatingSystems = ['Windows 11', 'macOS 14', 'iOS 17', 'Android 14', 'Linux'];

  const numChanges = Math.floor(Math.random() * 20) + 10; // 10-30个变更记录

  for (let i = 0; i < numChanges; i++) {
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)]!;
    const department = departments[Math.floor(Math.random() * departments.length)]!;
    const role = roles[Math.floor(Math.random() * roles.length)]!;
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]!;
    const location = locations[Math.floor(Math.random() * locations.length)]!;
    const os = operatingSystems[Math.floor(Math.random() * operatingSystems.length)]!;

    // 生成时间戳（过去30天内的随机时间）
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

    // 根据变更类型计算风险分数
    const riskScore = calculateRiskScore(changeType, role);
    const impact = getImpactLevel(riskScore);

    const change: ChangeRecord = {
      changeId: `change_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp,
      changeType,
      description: getChangeDescription(changeType),
      user: {
        userId: `user_${Math.random().toString(36).substring(2, 8)}`,
        username: `${role}${i + 1}`,
        department,
        role
      },
      device: {
        deviceId: `device_${Math.random().toString(36).substring(2, 10)}`,
        deviceType,
        os,
        location
      },
      details: generateChangeDetails(changeType, watermarkId),
      riskScore,
      impact,
      verified: Math.random() > 0.2 // 80%的变更已验证
    };

    changes.push(change);
  }

  return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function calculateRiskScore(changeType: ChangeRecord['changeType'], role: string): number {
  const baseScores = {
    embed: 20,
    extract: 30,
    modify: 60,
    copy: 40,
    move: 35,
    delete: 80,
    restore: 50,
    verify: 10
  };

  const roleMultipliers = {
    '员工': 1.2,
    '主管': 1.0,
    '经理': 0.9,
    '总监': 0.8,
    '系统管理员': 0.7
  };

  const baseScore = baseScores[changeType];
  const multiplier = roleMultipliers[role as keyof typeof roleMultipliers] || 1.0;
  
  return Math.min(100, Math.floor(baseScore * multiplier + Math.random() * 20));
}

function getImpactLevel(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

function getChangeDescription(changeType: ChangeRecord['changeType']): string {
  const descriptions = {
    embed: '在文档中嵌入水印',
    extract: '从文档中提取水印信息',
    modify: '修改水印参数或内容',
    copy: '复制带水印的文档',
    move: '移动带水印的文档',
    delete: '删除水印或带水印的文档',
    restore: '恢复已删除的水印',
    verify: '验证水印完整性'
  };

  return descriptions[changeType];
}

function generateChangeDetails(changeType: ChangeRecord['changeType'], watermarkId: string): ChangeRecord['details'] {
  const fileHash = `sha256_${Math.random().toString(36).substring(2, 16)}`;
  const checksum = `md5_${Math.random().toString(36).substring(2, 12)}`;

  const commonDetails = {
    fileHash,
    checksum
  };

  switch (changeType) {
    case 'embed':
      return {
        ...commonDetails,
        newState: 'watermarked',
        parameters: {
          watermarkText: '机密文档',
          opacity: Math.random() * 0.5 + 0.2,
          position: ['center', 'diagonal', 'corner'][Math.floor(Math.random() * 3)],
          algorithm: 'lsb_text'
        }
      };

    case 'extract':
      return {
        ...commonDetails,
        parameters: {
          extractedText: '机密文档',
          confidence: Math.random() * 0.3 + 0.7,
          method: 'visual_analysis'
        }
      };

    case 'modify':
      return {
        ...commonDetails,
        previousState: 'watermarked',
        newState: 'modified_watermark',
        parameters: {
          oldOpacity: Math.random() * 0.5 + 0.2,
          newOpacity: Math.random() * 0.5 + 0.2,
          changeReason: 'policy_update'
        }
      };

    case 'copy':
      return {
        ...commonDetails,
        newState: 'copied',
        parameters: {
          destinationPath: '/documents/copy_' + Math.random().toString(36).substring(2, 8),
          preserveWatermark: true
        }
      };

    case 'move':
      return {
        ...commonDetails,
        previousState: '/documents/original/',
        newState: '/documents/moved/',
        parameters: {
          preserveWatermark: true
        }
      };

    case 'delete':
      return {
        ...commonDetails,
        previousState: 'watermarked',
        newState: 'deleted',
        parameters: {
          deleteReason: 'user_request',
          backupCreated: Math.random() > 0.5
        }
      };

    case 'restore':
      return {
        ...commonDetails,
        previousState: 'deleted',
        newState: 'restored',
        parameters: {
          restoreSource: 'backup',
          restoreTime: new Date().toISOString()
        }
      };

    case 'verify':
      return {
        ...commonDetails,
        parameters: {
          verificationMethod: 'checksum_validation',
          isValid: Math.random() > 0.1,
          lastVerified: new Date().toISOString()
        }
      };

    default:
      return commonDetails;
  }
}

function analyzeChanges(changes: ChangeRecord[]): {
  totalChanges: number;
  changeTypes: Record<string, number>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeline: {
    last24h: number;
    last7days: number;
    last30days: number;
    older: number;
  };
  riskAnalysis: {
    averageRiskScore: number;
    highRiskChanges: number;
    unverifiedChanges: number;
    suspiciousPatterns: string[];
  };
  integrityStatus: {
    isIntact: boolean;
    lastVerified: string;
    checksumValid: boolean;
    tamperedSigns: string[];
  };
} {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // 统计变更类型
  const changeTypes = changes.reduce((acc, change) => {
    acc[change.changeType] = (acc[change.changeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 时间线分析
  const timeline = {
    last24h: changes.filter(c => now - new Date(c.timestamp).getTime() < day).length,
    last7days: changes.filter(c => now - new Date(c.timestamp).getTime() < 7 * day).length,
    last30days: changes.filter(c => now - new Date(c.timestamp).getTime() < 30 * day).length,
    older: 0
  };
  timeline.older = changes.length - timeline.last30days;

  // 风险分析
  const averageRiskScore = changes.length > 0 ? 
    changes.reduce((sum, c) => sum + c.riskScore, 0) / changes.length : 0;
  
  const highRiskChanges = changes.filter(c => c.riskScore >= 70).length;
  const unverifiedChanges = changes.filter(c => !c.verified).length;

  // 检测可疑模式
  const suspiciousPatterns: string[] = [];
  
  if (timeline.last24h > 10) {
    suspiciousPatterns.push('过去24小时内变更频率异常高');
  }
  
  if (highRiskChanges > 5) {
    suspiciousPatterns.push('检测到过多高风险变更操作');
  }
  
  if (unverifiedChanges > changes.length * 0.3) {
    suspiciousPatterns.push('未验证的变更比例过高');
  }

  const deleteCount = changeTypes.delete || 0;
  const modifyCount = changeTypes.modify || 0;
  if (deleteCount > 3) {
    suspiciousPatterns.push('检测到频繁的删除操作');
  }
  
  if (modifyCount > 5) {
    suspiciousPatterns.push('检测到频繁的修改操作');
  }

  // 确定整体风险级别
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (averageRiskScore >= 80 || suspiciousPatterns.length >= 4) {
    riskLevel = 'critical';
  } else if (averageRiskScore >= 60 || suspiciousPatterns.length >= 3) {
    riskLevel = 'high';
  } else if (averageRiskScore >= 40 || suspiciousPatterns.length >= 2) {
    riskLevel = 'medium';
  }

  // 完整性状态
  const verifyChanges = changes.filter(c => c.changeType === 'verify');
  const lastVerifyChange = verifyChanges.length > 0 ? verifyChanges[0] : null;
  
  const tamperedSigns: string[] = [];
  if (deleteCount > 0) tamperedSigns.push('检测到删除操作');
  if (modifyCount > 2) tamperedSigns.push('检测到多次修改操作');
  if (unverifiedChanges > 5) tamperedSigns.push('存在大量未验证的变更');

  const integrityStatus = {
    isIntact: tamperedSigns.length === 0 && averageRiskScore < 50,
    lastVerified: lastVerifyChange?.timestamp || '从未验证',
    checksumValid: Math.random() > 0.1, // 90%概率校验和有效
    tamperedSigns
  };

  return {
    totalChanges: changes.length,
    changeTypes,
    riskLevel,
    timeline,
    riskAnalysis: {
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      highRiskChanges,
      unverifiedChanges,
      suspiciousPatterns
    },
    integrityStatus
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WatermarkChangeStatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('📈 水印变更记录统计API调用');

    const { watermarkId } = req.body as WatermarkChangeRequest;

    // 参数验证
    if (!watermarkId) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: watermarkId'
      });
    }

    console.log('📋 统计参数:', { watermarkId });

    // 生成模拟变更记录
    const changeHistory = generateMockChangeRecords(watermarkId);
    
    // 分析变更数据
    const analysis = analyzeChanges(changeHistory);

    const responseData = {
      ...analysis,
      changeHistory
    };

    console.log('✅ 水印变更记录统计完成:', {
      watermarkId,
      totalChanges: analysis.totalChanges,
      riskLevel: analysis.riskLevel,
      averageRiskScore: analysis.riskAnalysis.averageRiskScore,
      isIntact: analysis.integrityStatus.isIntact
    });

    res.status(200).json({
      code: 200,
      message: '水印变更记录统计成功',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 水印变更记录统计失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '水印变更记录统计失败'
    });
  }
}
