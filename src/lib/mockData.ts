/**
 * 动态Mock数据生成器 - 增强版
 * 每2小时更新一次，流量数据逐步增加
 * 支持150+条真实化数据生成
 */

interface TrafficStats {
  totalRules: number;
  activeRules: number;
  todayExecutions: number;
  successRate: number;
  totalTraffic: number;
  dyedTraffic: number;
  timestamp: string;
}

interface TrafficRule {
  id: string;
  name: string;
  appType: 'web' | 'app' | 'api';
  protocol: 'http' | 'https' | 'tcp' | 'udp';
  targetIp: string;
  priority: number;
  status: 'active' | 'inactive' | 'processing';
  dyeResult?: string;
  traceInfo?: {
    path: string[];
    currentNode: string;
    status: 'success' | 'failed' | 'processing';
    latency: number;
  };
  reportData?: {
    totalRequests: number;
    dyedRequests: number;
    successRate: number;
    avgLatency: number;
    errorCount: number;
    peakHours: number[];
  };
  createTime: string;
  updateTime: string;
  lastExecuteTime?: string;
}

class MockDataGenerator {
  private baseTime = new Date('2024-01-15T00:00:00Z');
  private intervalHours = 2;
  
  /**
   * 获取当前时间周期索引
   */
  private getCurrentPeriod(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.baseTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.floor(diffHours / this.intervalHours);
  }

  /**
   * 生成基于时间的递增数据
   */
  private generateProgressiveValue(base: number, growth: number, variance = 0.1): number {
    const period = this.getCurrentPeriod();
    const trend = base + (growth * period);
    const random = 1 + (Math.random() - 0.5) * variance;
    return Math.floor(trend * random);
  }

  /**
   * 生成真实的内网IP段
   */
  private generateIP(): string {
    // 真实的内网IP段
    const ipRanges = [
      { prefix: "192.168.1", range: [10, 200] },
      { prefix: "192.168.10", range: [1, 100] },
      { prefix: "10.0.0", range: [10, 254] },
      { prefix: "10.1.0", range: [1, 100] },
      { prefix: "172.16.0", range: [10, 100] },
      { prefix: "172.17.0", range: [1, 50] },
      { prefix: "10.10.10", range: [1, 50] }, // 测试环境
      { prefix: "172.18.0", range: [1, 30] }, // 生产环境
    ];

    const range = ipRanges[Math.floor(Math.random() * ipRanges.length)]!;
    const lastOctet = Math.floor(Math.random() * (range.range[1]! - range.range[0]! + 1)) + range.range[0]!;
    return `${range.prefix}.${lastOctet}`;
  }

  /**
   * 生成多样化的规则名称
   */
  private generateRuleName(type: string, index: number): string {
    const typeNames = {
      web: [
        'Web服务', '前端应用', '网站流量', 'H5页面', '企业门户', '用户中心',
        '管理后台', '数据看板', '监控平台', '运营系统', '客服平台', '营销系统',
        '电商平台', '内容管理', '博客系统', '论坛社区', '在线教育', '视频平台'
      ],
      app: [
        '移动应用', 'APP接口', '客户端', '移动端', '企业通讯', '移动办公',
        '社交网络', '新闻客户端', '视频播放', '音乐应用', '阅读软件', '游戏平台',
        '健康管理', '运动追踪', '导航地图', '拍照美化', '笔记应用', '任务管理'
      ],
      api: [
        'API网关', '微服务', '接口服务', '后端API', '认证服务', '支付网关',
        '消息推送', '文件上传', '邮件服务', '短信验证', '数据同步', '缓存服务',
        '搜索引擎', '推荐算法', '图像识别', '语音服务', '翻译接口', '监控告警'
      ]
    };

    const names = typeNames[type as keyof typeof typeNames] || ['通用规则'];
    const randomName = names[Math.floor(Math.random() * names.length)];

    // 添加环境和版本标识
    const environments = ['dev', 'test', 'staging', 'prod'];
    const departments = ['finance', 'hr', 'sales', 'ops', 'dev'];
    const env = environments[Math.floor(Math.random() * environments.length)];
    const dept = departments[Math.floor(Math.random() * departments.length)];

    // 多种命名模式
    const patterns = [
      `${randomName}_${env}_${String(index).padStart(3, '0')}`,
      `${dept}_${randomName}`,
      `${randomName}_v${Math.floor(Math.random() * 5) + 1}`,
      `${randomName}_cluster_${String(index).padStart(2, '0')}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)]!;
  }

  /**
   * 生成过去30天内的随机时间
   */
  private generatePastTime(): string {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
    return new Date(randomTime).toISOString();
  }

  /**
   * 生成批量规则数据
   */
  generateRules(count = 150): TrafficRule[] {
    const rules: TrafficRule[] = [];
    const appTypes: Array<'web' | 'app' | 'api'> = ['web', 'app', 'api'];
    const protocols: Array<'http' | 'https' | 'tcp' | 'udp'> = ['http', 'https', 'tcp', 'udp'];
    const statuses: Array<'active' | 'inactive' | 'processing'> = ['active', 'inactive', 'processing'];

    for (let i = 1; i <= count; i++) {
      const appType = appTypes[Math.floor(Math.random() * appTypes.length)]!;
      const protocol = protocols[Math.floor(Math.random() * protocols.length)]!;
      const status = statuses[Math.floor(Math.random() * statuses.length)]!;
      const createTime = this.generatePastTime();
      const updateTime = new Date(Date.parse(createTime) + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

      const rule: TrafficRule = {
        id: `rule_${String(i).padStart(3, '0')}_${Date.now()}`,
        name: this.generateRuleName(appType, i),
        appType,
        protocol,
        targetIp: this.generateIP(),
        priority: Math.floor(Math.random() * 100) + 1,
        status,
        createTime,
        updateTime,
      };

      // 20% 概率包含染色结果
      if (Math.random() < 0.2) {
        rule.dyeResult = JSON.stringify(this.generateDyeResult(rule.id));
      }

      // 30% 概率包含追踪信息
      if (Math.random() < 0.3) {
        rule.traceInfo = {
          path: [rule.targetIp, this.generateIP(), this.generateIP()],
          currentNode: rule.targetIp,
          status: Math.random() > 0.8 ? 'failed' : 'success',
          latency: Math.floor(Math.random() * 200) + 50
        };
      }

      // 25% 概率包含报告数据
      if (Math.random() < 0.25) {
        const totalRequests = Math.floor(Math.random() * 10000) + 1000;
        rule.reportData = {
          totalRequests,
          dyedRequests: Math.floor(totalRequests * (0.3 + Math.random() * 0.4)),
          successRate: 90 + Math.random() * 10,
          avgLatency: Math.floor(Math.random() * 200) + 50,
          errorCount: Math.floor(totalRequests * (Math.random() * 0.05)),
          peakHours: [9, 14, 20]
        };
      }

      rules.push(rule);
    }

    return rules;
  }

  /**
   * 生成统计数据
   */
  generateStats(): TrafficStats {
    const period = this.getCurrentPeriod();
    
    return {
      totalRules: this.generateProgressiveValue(150, 5, 0.05), // 每周期增长5条规则
      activeRules: this.generateProgressiveValue(120, 3, 0.08),
      todayExecutions: this.generateProgressiveValue(2000, 300, 0.15), // 每周期增长300次执行
      successRate: Math.min(99.8, 95 + (period * 0.1)), // 成功率逐步提升
      totalTraffic: this.generateProgressiveValue(80000, 8000, 0.2), // GB
      dyedTraffic: this.generateProgressiveValue(25000, 3000, 0.25), // GB
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成染色执行结果
   */
  generateDyeResult(ruleId: string) {
    const success = Math.random() > 0.05; // 95%成功率
    
    return {
      dyeId: `dye_${Date.now()}_${ruleId}`,
      status: success ? 'success' : 'failed',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + Math.random() * 5000).toISOString(), // 0-5秒执行时间
      affectedRequests: this.generateProgressiveValue(200, 100, 0.4),
      dyeRate: Math.min(100, 60 + Math.random() * 35), // 60-95%染色率
      message: success ? '染色执行成功' : '染色执行失败，请检查网络连接'
    };
  }

  /**
   * 获取实时统计趋势
   */
  generateTrendData(hours = 24) {
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60 * 60 * 1000);
      const _hourPeriod = Math.floor((time.getTime() - this.baseTime.getTime()) / (1000 * 60 * 60 * this.intervalHours));
      
      data.push({
        time: time.toISOString(),
        totalTraffic: this.generateProgressiveValue(3000, 300, 0.3),
        dyedTraffic: this.generateProgressiveValue(900, 120, 0.4),
        requests: this.generateProgressiveValue(800, 80, 0.5),
        errors: Math.floor(Math.random() * 15),
        period: _hourPeriod
      });
    }
    
    return data;
  }
}

// 单例模式
export const mockDataGenerator = new MockDataGenerator();

// 导出类型
export type { TrafficStats, TrafficRule };
