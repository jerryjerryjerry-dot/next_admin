import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  BarChart3, 
  Shield, 
  Search, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Settings,
  Activity
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { useState, useEffect } from "react";

interface StatsDashboardProps {
  onTabChange?: (tab: string) => void;
}

export function StatsDashboard({ onTabChange }: StatsDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/watermark/stats');
        const result = await response.json() as {
          success: boolean;
          data: any;
        };

        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // 图表配色
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="mt-1 text-sm text-gray-500">
          数字水印系统使用统计和趋势分析
        </p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 今日嵌入 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">今日嵌入</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayEmbeds}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+12.5%</span>
            <span className="text-gray-500 ml-1">vs 昨日</span>
          </div>
        </Card>

        {/* 今日提取 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">今日提取</p>
              <p className="text-2xl font-bold text-green-600">{stats.todayExtracts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Search className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+8.3%</span>
            <span className="text-gray-500 ml-1">vs 昨日</span>
          </div>
        </Card>

        {/* 总记录数 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总记录数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-gray-500">累计处理</span>
          </div>
        </Card>

        {/* 成功率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">成功率</p>
              <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Clock className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-gray-500">平均 {stats.avgProcessTime}s</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 趋势图表 */}
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">7天趋势</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">嵌入</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">提取</span>
                </div>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).getMonth() + 1 + '/' + new Date(value).getDate()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      value, 
                      name === 'embeds' ? '嵌入数量' : '提取数量'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="embeds" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="extracts" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 热门策略 */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">热门策略</h3>
            
            <div className="space-y-3">
              {stats.topPolicies.map((policy: any, index: number) => (
                <div key={policy.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{policy.name}</p>
                      <p className="text-xs text-gray-500">{policy.count} 次使用</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {policy.percentage.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>

            {/* 策略使用分布饼图 */}
            <div className="mt-6 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topPolicies}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats.topPolicies.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, '使用次数']}
                    labelFormatter={(label) => `策略: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* 快速操作区域 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card 
          className="p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md" 
          onClick={() => onTabChange?.('process')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">处理文件</h3>
              <p className="text-sm text-gray-500">上传文件进行水印处理</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md" 
          onClick={() => onTabChange?.('policies')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">管理策略</h3>
              <p className="text-sm text-gray-500">配置水印策略参数</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md" 
          onClick={() => onTabChange?.('records')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium">查看记录</h3>
              <p className="text-sm text-gray-500">浏览历史处理记录</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 系统状态 */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">系统状态</h3>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">水印服务</p>
                <p className="text-xs text-green-600">运行正常</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">数据库</p>
                <p className="text-xs text-green-600">连接正常</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">处理队列</p>
                <p className="text-xs text-blue-600">2 个任务</p>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">存储空间</p>
                <p className="text-xs text-gray-600">78% 已使用</p>
              </div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
