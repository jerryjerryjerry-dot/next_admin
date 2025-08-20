import type { NextApiRequest, NextApiResponse } from 'next';

interface ComplianceReportRequest {
  watermarkId: string;
  timeRange: string; // 格式: "2024-01-01,2024-01-31" 或 "last_30_days", "last_7_days"
}

interface ComplianceViolation {
  violationId: string;
  timestamp: string;
  type: 'unauthorized_access' | 'policy_breach' | 'suspicious_activity' | 'data_leak_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  user: {
    userId: string;
    username: string;
    department: string;
  };
  device: {
    deviceId: string;
    deviceType: string;
    location: string;
  };
  action: string;
  evidence: {
    logs: string[];
    screenshots?: string[];
    metadata: Record<string, any>;
  };
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
}

interface ComplianceReportResponse {
  code: number;
  message?: string;
  data?: {
    reportId: string;
    violations: number;
    pdfUrl: string;
    summary: {
      totalEvents: number;
      violationsByType: Record<string, number>;
      violationsBySeverity: Record<string, number>;
      complianceScore: number; // 0-100
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    violationDetails: ComplianceViolation[];
    recommendations: string[];
    generatedAt: string;
  };
  error?: string;
}

// 生成模拟违规记录
function generateMockViolations(watermarkId: string, timeRange: string): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const violationTypes = ['unauthorized_access', 'policy_breach', 'suspicious_activity', 'data_leak_risk'] as const;
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  const departments = ['技术部', '市场部', '财务部', '人事部', '法务部'];
  const deviceTypes = ['desktop', 'mobile', 'tablet', 'server'];
  const locations = ['北京', '上海', '深圳', '杭州', '广州'];

  // 根据时间范围确定违规数量
  const numViolations = Math.floor(Math.random() * 8) + 2; // 2-10个违规

  for (let i = 0; i < numViolations; i++) {
    const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)]!;
    const severity = severities[Math.floor(Math.random() * severities.length)]!;
    const department = departments[Math.floor(Math.random() * departments.length)]!;
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]!;
    const location = locations[Math.floor(Math.random() * locations.length)]!;

    const violation: ComplianceViolation = {
      violationId: `viol_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      type: violationType,
      severity,
      description: getViolationDescription(violationType, severity),
      user: {
        userId: `user_${Math.random().toString(36).substring(2, 8)}`,
        username: `用户${i + 1}`,
        department
      },
      device: {
        deviceId: `device_${Math.random().toString(36).substring(2, 10)}`,
        deviceType,
        location
      },
      action: getViolationAction(violationType),
      evidence: {
        logs: [
          `${new Date().toISOString()} - ${violationType} detected`,
          `${new Date().toISOString()} - User ${`用户${i + 1}`} performed ${getViolationAction(violationType)}`,
          `${new Date().toISOString()} - Security alert triggered`
        ],
        metadata: {
          watermarkId,
          riskScore: Math.floor(Math.random() * 100),
          confidence: Math.random() * 0.3 + 0.7 // 70%-100%
        }
      },
      status: ['open', 'investigating', 'resolved', 'false_positive'][Math.floor(Math.random() * 4)] as any,
      assignedTo: Math.random() > 0.5 ? '安全管理员' : undefined,
      resolution: Math.random() > 0.7 ? '已确认为误报' : undefined
    };

    violations.push(violation);
  }

  return violations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getViolationDescription(type: ComplianceViolation['type'], severity: ComplianceViolation['severity']): string {
  const descriptions = {
    unauthorized_access: {
      low: '用户在非工作时间访问了文档',
      medium: '用户从未授权设备访问了敏感文档',
      high: '检测到来自异常地理位置的访问',
      critical: '发现使用被盗凭据的未授权访问'
    },
    policy_breach: {
      low: '文档访问时间超出了策略规定的时长',
      medium: '用户违反了文档分享策略',
      high: '检测到违反数据处理策略的行为',
      critical: '严重违反了数据保护合规要求'
    },
    suspicious_activity: {
      low: '检测到异常的文档访问模式',
      medium: '用户在短时间内访问了大量敏感文档',
      high: '发现可疑的数据导出活动',
      critical: '检测到潜在的内部威胁行为'
    },
    data_leak_risk: {
      low: '文档被复制到了个人设备',
      medium: '检测到文档的未授权传输',
      high: '发现文档被上传到了外部服务',
      critical: '检测到高风险的数据泄露行为'
    }
  };

  return descriptions[type][severity];
}

function getViolationAction(type: ComplianceViolation['type']): string {
  const actions = {
    unauthorized_access: '非授权访问',
    policy_breach: '策略违规',
    suspicious_activity: '可疑活动',
    data_leak_risk: '数据泄露风险'
  };

  return actions[type];
}

function calculateComplianceScore(violations: ComplianceViolation[]): number {
  if (violations.length === 0) return 100;

  const severityWeights = {
    low: 5,
    medium: 15,
    high: 30,
    critical: 50
  };

  const totalDeduction = violations.reduce((sum, violation) => {
    return sum + severityWeights[violation.severity];
  }, 0);

  return Math.max(0, 100 - totalDeduction);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function generateRecommendations(violations: ComplianceViolation[]): string[] {
  const recommendations: string[] = [];
  
  const hasUnauthorizedAccess = violations.some(v => v.type === 'unauthorized_access');
  const hasPolicyBreach = violations.some(v => v.type === 'policy_breach');
  const hasSuspiciousActivity = violations.some(v => v.type === 'suspicious_activity');
  const hasDataLeakRisk = violations.some(v => v.type === 'data_leak_risk');
  const hasCriticalViolations = violations.some(v => v.severity === 'critical');

  if (hasUnauthorizedAccess) {
    recommendations.push('加强身份验证和访问控制机制');
    recommendations.push('实施多因素认证以防止未授权访问');
  }

  if (hasPolicyBreach) {
    recommendations.push('更新和强化数据处理策略');
    recommendations.push('加强员工合规培训');
  }

  if (hasSuspiciousActivity) {
    recommendations.push('部署更先进的行为分析系统');
    recommendations.push('建立实时监控和告警机制');
  }

  if (hasDataLeakRisk) {
    recommendations.push('实施数据丢失防护(DLP)解决方案');
    recommendations.push('限制数据的外部传输权限');
  }

  if (hasCriticalViolations) {
    recommendations.push('立即调查所有关键违规事件');
    recommendations.push('考虑暂停相关用户的访问权限');
  }

  if (violations.length > 5) {
    recommendations.push('全面审查当前的安全策略和流程');
  }

  if (recommendations.length === 0) {
    recommendations.push('继续保持当前的安全监控水平');
    recommendations.push('定期进行合规性审计');
  }

  return recommendations;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComplianceReportResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('📊 合规审计报告生成API调用');

    const { watermarkId, timeRange } = req.body as ComplianceReportRequest;

    // 参数验证
    if (!watermarkId) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: watermarkId'
      });
    }

    if (!timeRange) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: timeRange'
      });
    }

    console.log('📋 生成参数:', { watermarkId, timeRange });

    // 生成违规记录
    const violations = generateMockViolations(watermarkId, timeRange);

    // 统计分析
    const violationsByType = violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsBySeverity = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complianceScore = calculateComplianceScore(violations);
    const riskLevel = getRiskLevel(complianceScore);
    const recommendations = generateRecommendations(violations);

    // 生成报告ID和PDF URL
    const reportId = `compliance_${watermarkId}_${Date.now()}`;
    const pdfUrl = `https://reports.example.com/compliance/${reportId}.pdf`;

    const responseData = {
      reportId,
      violations: violations.length,
      pdfUrl,
      summary: {
        totalEvents: violations.length + Math.floor(Math.random() * 50) + 20, // 总事件数（包括正常事件）
        violationsByType,
        violationsBySeverity,
        complianceScore,
        riskLevel
      },
      violationDetails: violations,
      recommendations,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ 合规审计报告生成成功:', {
      reportId,
      watermarkId,
      violationsCount: violations.length,
      complianceScore,
      riskLevel
    });

    res.status(200).json({
      code: 200,
      message: '合规审计报告生成成功',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 合规审计报告生成失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '合规审计报告生成失败'
    });
  }
}
