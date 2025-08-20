import type { 
  WatermarkPolicy, 
  CreatePolicyInput, 
  UpdatePolicyInput, 
  PolicyListInput,
  DashboardStats 
} from "~/types/watermark";

// Mock策略数据服务
export class MockPolicyService {
  private policies: WatermarkPolicy[] = [
    {
      id: 'policy-1',
      name: '高密级文档策略',
      fileTypes: JSON.stringify(['pdf', 'doc', 'docx']),
      sensitivity: 'high',
      embedDepth: 8,
      description: '适用于机密级别文档的高强度水印，确保最高级别的安全保护',
      isDefault: true,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
    },
    {
      id: 'policy-2',
      name: '普通办公文档策略',
      fileTypes: JSON.stringify(['pdf', 'doc', 'docx', 'xls', 'xlsx']),
      sensitivity: 'medium',
      embedDepth: 5,
      description: '适用于日常办公文档的标准水印，平衡安全性和性能',
      isDefault: false,
      status: 'active',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      createdById: 'user-1',
    },
    {
      id: 'policy-3',
      name: '外发文档策略',
      fileTypes: JSON.stringify(['pdf']),
      sensitivity: 'low',
      embedDepth: 3,
      description: '适用于对外发布文档的轻量水印，不影响阅读体验',
      isDefault: false,
      status: 'active',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      createdById: 'user-1',
    },
    {
      id: 'policy-4',
      name: '演示文档策略',
      fileTypes: JSON.stringify(['ppt', 'pptx']),
      sensitivity: 'medium',
      embedDepth: 4,
      description: '专门用于演示文稿的水印策略',
      isDefault: false,
      status: 'disabled',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
      createdById: 'user-1',
    },
  ];

  // 获取策略列表
  async getList(input: PolicyListInput) {
    let filteredPolicies = [...this.policies];

    // 应用筛选条件
    if (input.keyword) {
      const keyword = input.keyword.toLowerCase();
      filteredPolicies = filteredPolicies.filter(policy => 
        policy.name.toLowerCase().includes(keyword) ||
        policy.description?.toLowerCase().includes(keyword)
      );
    }

    if (input.status) {
      filteredPolicies = filteredPolicies.filter(policy => policy.status === input.status);
    }

    if (input.sensitivity) {
      filteredPolicies = filteredPolicies.filter(policy => policy.sensitivity === input.sensitivity);
    }

    // 分页
    const total = filteredPolicies.length;
    const startIndex = (input.page - 1) * input.pageSize;
    const endIndex = startIndex + input.pageSize;
    const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      list: paginatedPolicies,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }

  // 创建策略
  async create(input: CreatePolicyInput): Promise<WatermarkPolicy> {
    const newPolicy: WatermarkPolicy = {
      id: `policy-${Date.now()}`,
      name: input.name,
      fileTypes: JSON.stringify(input.fileTypes),
      sensitivity: input.sensitivity,
      embedDepth: input.embedDepth,
      description: input.description,
      isDefault: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'current-user',
    };

    this.policies.unshift(newPolicy);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    return newPolicy;
  }

  // 更新策略
  async update(input: UpdatePolicyInput): Promise<WatermarkPolicy> {
    const index = this.policies.findIndex(p => p.id === input.id);
    if (index === -1) {
      throw new Error('策略不存在');
    }

    const updatedPolicy = {
      ...this.policies[index]!,
      ...input,
      fileTypes: input.fileTypes ? JSON.stringify(input.fileTypes) : this.policies[index]!.fileTypes,
      updatedAt: new Date(),
    };

    this.policies[index] = updatedPolicy;

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 250));

    return updatedPolicy;
  }

  // 删除策略
  async delete(id: string): Promise<void> {
    const index = this.policies.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('策略不存在');
    }

    // 检查是否为默认策略
    if (this.policies[index]!.isDefault) {
      throw new Error('不能删除默认策略');
    }

    this.policies.splice(index, 1);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 根据ID获取策略
  async getById(id: string): Promise<WatermarkPolicy | null> {
    return this.policies.find(p => p.id === id) ?? null;
  }

  // 获取活跃策略列表
  async getActivePolicies(): Promise<WatermarkPolicy[]> {
    return this.policies.filter(p => p.status === 'active');
  }
}

// Mock统计数据服务
export class MockStatsService {
  // 获取Dashboard统计数据
  async getDashboard(): Promise<DashboardStats> {
    // 模拟实时数据变化
    const baseDate = new Date();
    const weeklyTrend = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      weeklyTrend.push({
        date: date.toISOString().split('T')[0]!,
        embeds: Math.floor(Math.random() * 50) + 100,
        extracts: Math.floor(Math.random() * 20) + 10,
      });
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      todayEmbeds: weeklyTrend[6]?.embeds ?? 156,
      todayExtracts: weeklyTrend[6]?.extracts ?? 23,
      totalRecords: 1248 + Math.floor(Math.random() * 100),
      successRate: 96.8 + Math.random() * 2,
      avgProcessTime: 45 + Math.floor(Math.random() * 20),
      weeklyTrend,
      topPolicies: [
        { name: '高密级文档策略', count: 89, percentage: 57.1 },
        { name: '普通办公文档策略', count: 45, percentage: 28.8 },
        { name: '外发文档策略', count: 22, percentage: 14.1 },
      ],
    };
  }

  // 生成Mock进度数据
  generateProgress(realStatus: unknown): number {
    if (!realStatus || typeof realStatus !== 'object') return 0;
    
    const status = realStatus as { task_status?: string };
    switch (status.task_status) {
      case 'pending':
        return Math.floor(Math.random() * 20) + 5; // 5-25%
      case 'processing':
        return Math.floor(Math.random() * 60) + 30; // 30-90%
      case 'finished':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  }

  // 生成Mock处理时间估算
  generateEstimatedTime(progress: number): string {
    if (progress >= 100) return '已完成';
    if (progress === 0) return '处理失败';
    
    const remainingPercent = 100 - progress;
    const estimatedSeconds = Math.floor((remainingPercent / 100) * 120); // 假设总共2分钟
    
    if (estimatedSeconds < 60) {
      return `预计还需 ${estimatedSeconds} 秒`;
    } else {
      const minutes = Math.floor(estimatedSeconds / 60);
      const seconds = estimatedSeconds % 60;
      return `预计还需 ${minutes}分${seconds}秒`;
    }
  }

  // 生成Mock处理结果优化
  enhanceProcessResult(realResult: unknown) {
    if (!realResult || typeof realResult !== 'object') return null;

    const result = realResult as { 
      result?: { data?: string }; 
      task_type?: string;
      [key: string]: unknown;
    };

    // 如果是嵌入水印成功
    if (result.result?.data && typeof result.result.data === 'string') {
      return {
        ...result,
        downloadUrl: result.result.data,
        fileSize: '2.34 MB',
        processingTime: '1分23秒',
        watermarkStrength: '高强度',
        securityLevel: '企业级',
      };
    }

    // 如果是提取水印成功
    if (result.result?.data && result.task_type === 'extract_watermark') {
      return {
        ...result,
        extractedContent: result.result.data,
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
        extractionMethod: '深度扫描',
        detectionPoints: Math.floor(Math.random() * 10) + 5,
      };
    }

    return realResult;
  }
}

// 单例实例
export const mockPolicyService = new MockPolicyService();
export const mockStatsService = new MockStatsService();
