import type { NextApiRequest, NextApiResponse } from 'next';

interface TraceRule {
  ruleId: string;
  name: string;
  description: string;
  traceDimensions: string[];
  reportTemplate: {
    templateId: string;
    templateName: string;
    sections: string[];
  };
  alertThresholds: {
    riskLevel: 'low' | 'medium' | 'high';
    maxViolations: number;
    alertChannels: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TraceRulesRequest {
  operation: 'create' | 'update' | 'delete' | 'query';
  ruleId?: string;
  rule?: Partial<TraceRule>;
}

interface TraceRulesResponse {
  code: number;
  msg: string;
  data?: TraceRule | TraceRule[] | { message: string };
}

// 模拟数据存储
let mockTraceRules: TraceRule[] = [
  {
    ruleId: 'rule_001',
    name: '高敏感文档溯源规则',
    description: '针对机密级别文档的全链路溯源追踪',
    traceDimensions: ['user_access', 'device_info', 'time_stamp', 'location', 'operation_type'],
    reportTemplate: {
      templateId: 'template_001',
      templateName: '高敏感文档溯源报告',
      sections: ['访问记录', '设备信息', '操作轨迹', '风险评估', '合规检查']
    },
    alertThresholds: {
      riskLevel: 'high',
      maxViolations: 3,
      alertChannels: ['email', 'sms', 'webhook']
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    ruleId: 'rule_002',
    name: '标准文档溯源规则',
    description: '适用于一般办公文档的基础溯源规则',
    traceDimensions: ['user_access', 'time_stamp', 'operation_type'],
    reportTemplate: {
      templateId: 'template_002',
      templateName: '标准文档溯源报告',
      sections: ['访问记录', '操作轨迹', '基础合规检查']
    },
    alertThresholds: {
      riskLevel: 'medium',
      maxViolations: 10,
      alertChannels: ['email']
    },
    isActive: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  },
  {
    ruleId: 'rule_003',
    name: '轻量溯源规则',
    description: '用于公开文档的简化溯源规则',
    traceDimensions: ['user_access', 'time_stamp'],
    reportTemplate: {
      templateId: 'template_003',
      templateName: '轻量溯源报告',
      sections: ['访问记录']
    },
    alertThresholds: {
      riskLevel: 'low',
      maxViolations: 50,
      alertChannels: ['webhook']
    },
    isActive: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z'
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TraceRulesResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      msg: '只支持POST请求'
    });
  }

  try {
    console.log('🔍 水印溯源规则管理API调用');

    const { operation, ruleId, rule } = req.body as TraceRulesRequest;

    // 参数验证
    if (!operation) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必需参数: operation'
      });
    }

    if (!['create', 'update', 'delete', 'query'].includes(operation)) {
      return res.status(400).json({
        code: 400,
        msg: 'operation参数必须是 create/update/delete/query 之一'
      });
    }

    console.log('📋 操作参数:', { operation, ruleId, hasRule: !!rule });

    switch (operation) {
      case 'create':
        if (!rule) {
          return res.status(400).json({
            code: 400,
            msg: 'create操作需要提供rule参数'
          });
        }

        const newRule: TraceRule = {
          ruleId: `rule_${Date.now()}`,
          name: rule.name || '未命名规则',
          description: rule.description || '',
          traceDimensions: rule.traceDimensions || ['user_access', 'time_stamp'],
          reportTemplate: rule.reportTemplate || {
            templateId: `template_${Date.now()}`,
            templateName: '默认报告模板',
            sections: ['访问记录']
          },
          alertThresholds: rule.alertThresholds || {
            riskLevel: 'medium',
            maxViolations: 10,
            alertChannels: ['email']
          },
          isActive: rule.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        mockTraceRules.push(newRule);

        console.log('✅ 溯源规则创建成功:', newRule.ruleId);

        return res.status(201).json({
          code: 200,
          msg: '溯源规则创建成功',
          data: newRule
        });

      case 'update':
        if (!ruleId) {
          return res.status(400).json({
            code: 400,
            msg: 'update操作需要提供ruleId参数'
          });
        }

        if (!rule) {
          return res.status(400).json({
            code: 400,
            msg: 'update操作需要提供rule参数'
          });
        }

        const ruleIndex = mockTraceRules.findIndex(r => r.ruleId === ruleId);
        if (ruleIndex === -1) {
          return res.status(404).json({
            code: 404,
            msg: `规则ID ${ruleId} 不存在`
          });
        }

        const updatedRule: TraceRule = {
          ...mockTraceRules[ruleIndex]!,
          ...rule,
          ruleId, // 保持原有ID
          updatedAt: new Date().toISOString()
        };

        mockTraceRules[ruleIndex] = updatedRule;

        console.log('✅ 溯源规则更新成功:', ruleId);

        return res.status(200).json({
          code: 200,
          msg: '溯源规则更新成功',
          data: updatedRule
        });

      case 'delete':
        if (!ruleId) {
          return res.status(400).json({
            code: 400,
            msg: 'delete操作需要提供ruleId参数'
          });
        }

        const deleteIndex = mockTraceRules.findIndex(r => r.ruleId === ruleId);
        if (deleteIndex === -1) {
          return res.status(404).json({
            code: 404,
            msg: `规则ID ${ruleId} 不存在`
          });
        }

        const deletedRule = mockTraceRules.splice(deleteIndex, 1)[0];

        console.log('✅ 溯源规则删除成功:', ruleId);

        return res.status(200).json({
          code: 200,
          msg: '溯源规则删除成功',
          data: { message: `规则 ${deletedRule?.name} 已删除` }
        });

      case 'query':
        if (ruleId) {
          // 查询单个规则
          const foundRule = mockTraceRules.find(r => r.ruleId === ruleId);
          if (!foundRule) {
            return res.status(404).json({
              code: 404,
              msg: `规则ID ${ruleId} 不存在`
            });
          }

          console.log('✅ 查询单个溯源规则成功:', ruleId);

          return res.status(200).json({
            code: 200,
            msg: '查询成功',
            data: foundRule
          });
        } else {
          // 查询所有规则
          console.log('✅ 查询所有溯源规则成功:', mockTraceRules.length);

          return res.status(200).json({
            code: 200,
            msg: '查询成功',
            data: mockTraceRules
          });
        }

      default:
        return res.status(400).json({
          code: 400,
          msg: '不支持的操作类型'
        });
    }

  } catch (error) {
    console.error('❌ 溯源规则管理失败:', error);
    
    return res.status(500).json({
      code: 500,
      msg: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
