import type { NextApiRequest, NextApiResponse } from 'next';

interface PolicyAdaptRequest {
  fileType: string;
  sensitivity: 'high' | 'medium' | 'low';
}

interface PolicyAdaptResponse {
  code: number;
  message?: string;
  data?: {
    policyId: string;
    embedDepth: number;
    compatibility: string;
  };
  error?: string;
}

// 策略适配规则配置
const POLICY_ADAPTATION_RULES = {
  // 文件类型适配规则
  fileTypeRules: {
    'pdf': {
      embedDepth: 3,
      compatibility: 'high',
      preferredPolicies: ['1', '2'] // 高强度策略
    },
    'doc': {
      embedDepth: 2,
      compatibility: 'medium',
      preferredPolicies: ['1', '3']
    },
    'docx': {
      embedDepth: 2,
      compatibility: 'medium',
      preferredPolicies: ['1', '3']
    },
    'xls': {
      embedDepth: 1,
      compatibility: 'low',
      preferredPolicies: ['3']
    },
    'xlsx': {
      embedDepth: 1,
      compatibility: 'low',
      preferredPolicies: ['3']
    },
    'ppt': {
      embedDepth: 2,
      compatibility: 'medium',
      preferredPolicies: ['1', '2']
    },
    'pptx': {
      embedDepth: 2,
      compatibility: 'medium',
      preferredPolicies: ['1', '2']
    }
  },
  
  // 敏感度适配规则
  sensitivityRules: {
    'high': {
      minEmbedDepth: 3,
      preferredPolicies: ['2'], // 高安全级别策略
      compatibility: 'high'
    },
    'medium': {
      minEmbedDepth: 2,
      preferredPolicies: ['1'], // 标准文档水印策略
      compatibility: 'medium'
    },
    'low': {
      minEmbedDepth: 1,
      preferredPolicies: ['3'], // 轻量水印策略
      compatibility: 'low'
    }
  }
};

// 预定义策略信息
const PREDEFINED_POLICIES = {
  '1': {
    id: '1',
    name: '标准文档水印',
    embedDepth: 2,
    compatibility: 'medium',
    sensitivity: 'medium'
  },
  '2': {
    id: '2',
    name: '高安全级别',
    embedDepth: 3,
    compatibility: 'high',
    sensitivity: 'high'
  },
  '3': {
    id: '3',
    name: '轻量水印',
    embedDepth: 1,
    compatibility: 'low',
    sensitivity: 'low'
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PolicyAdaptResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      error: '只支持POST请求'
    });
  }

  try {
    console.log('🎯 水印策略适配查询API调用');

    const { fileType, sensitivity } = req.body as PolicyAdaptRequest;

    // 参数验证
    if (!fileType) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: fileType'
      });
    }

    if (!sensitivity) {
      return res.status(400).json({
        code: 400,
        error: '缺少必需参数: sensitivity'
      });
    }

    if (!['high', 'medium', 'low'].includes(sensitivity)) {
      return res.status(400).json({
        code: 400,
        error: 'sensitivity参数必须是 high/medium/low 之一'
      });
    }

    console.log('📋 适配参数:', { fileType, sensitivity });

    // 标准化文件类型
    const normalizedFileType = fileType.toLowerCase().replace(/^\./, '');
    
    // 获取文件类型规则
    const fileRule = POLICY_ADAPTATION_RULES.fileTypeRules[normalizedFileType as keyof typeof POLICY_ADAPTATION_RULES.fileTypeRules];
    
    if (!fileRule) {
      return res.status(400).json({
        code: 400,
        error: `不支持的文件类型: ${fileType}`
      });
    }

    // 获取敏感度规则
    const sensitivityRule = POLICY_ADAPTATION_RULES.sensitivityRules[sensitivity];

    // 策略适配逻辑
    let selectedPolicyId: string;
    let embedDepth: number;
    let compatibility: string;

    // 找到同时满足文件类型和敏感度要求的策略
    const commonPolicies = fileRule.preferredPolicies.filter(policyId => 
      sensitivityRule.preferredPolicies.includes(policyId)
    );

    if (commonPolicies.length > 0) {
      // 有完全匹配的策略
      selectedPolicyId = commonPolicies[0]!;
    } else {
      // 优先满足敏感度要求
      selectedPolicyId = sensitivityRule.preferredPolicies[0]!;
    }

    const selectedPolicy = PREDEFINED_POLICIES[selectedPolicyId as keyof typeof PREDEFINED_POLICIES];
    
    if (!selectedPolicy) {
      return res.status(500).json({
        code: 500,
        error: '策略适配失败：找不到合适的策略'
      });
    }

    // 计算嵌入深度（取文件类型要求和敏感度要求的较大值）
    embedDepth = Math.max(fileRule.embedDepth, sensitivityRule.minEmbedDepth);

    // 计算兼容性（取较严格的级别）
    const compatibilityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
    const fileCompatibility = compatibilityLevels[fileRule.compatibility as keyof typeof compatibilityLevels] || 1;
    const sensitivityCompatibility = compatibilityLevels[sensitivityRule.compatibility as keyof typeof compatibilityLevels] || 1;
    const finalCompatibilityLevel = Math.max(fileCompatibility, sensitivityCompatibility);
    
    compatibility = Object.keys(compatibilityLevels).find(
      key => compatibilityLevels[key as keyof typeof compatibilityLevels] === finalCompatibilityLevel
    ) || 'medium';

    const responseData = {
      policyId: selectedPolicyId,
      embedDepth: embedDepth,
      compatibility: compatibility
    };

    console.log('✅ 策略适配成功:', {
      fileType: normalizedFileType,
      sensitivity,
      selectedPolicy: selectedPolicy.name,
      ...responseData
    });

    res.status(200).json({
      code: 200,
      message: '策略适配成功',
      data: responseData
    });

  } catch (error) {
    console.error('❌ 策略适配查询失败:', error);
    
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '策略适配查询失败'
    });
  }
}
