"use client";

import { PandaTechChart } from "./PandaTechChart";
import { PandaTechRadar } from "./PandaTechRadar";
import { PandaTechRing } from "./PandaTechRing";

interface ModulePerformanceData {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: "healthy" | "warning" | "error";
}

interface ChartData {
  timestamp: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  responseTime: number;
}

interface ConnectionData {
  totalConnections: number;
  activeConnections: number;
  errorConnections: number;
}

interface PandaTechDashboardProps {
  chartData: ChartData[];
  moduleData: ModulePerformanceData[];
  connectionData: ConnectionData;
}

export const PandaTechDashboard: React.FC<PandaTechDashboardProps> = ({
  chartData,
  moduleData,
  connectionData
}) => {
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* 主要监控图表 */}
      <div className="w-full">
        <PandaTechChart
          title="🐼 API调用实时监控"
          data={chartData}
          width={1000}
          height={350}
          className="w-full"
        />
      </div>

      {/* 性能监控网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 模块性能雷达图 */}
        <PandaTechRadar
          data={moduleData}
          width={450}
          height={450}
        />

        {/* 连接状态环形图 */}
        <PandaTechRing
          totalConnections={connectionData.totalConnections}
          activeConnections={connectionData.activeConnections}
          errorConnections={connectionData.errorConnections}
          width={450}
          height={450}
        />
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg p-4 shadow-xl">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">系统运行正常</span>
            </div>
            <div className="w-px h-6 bg-slate-600"></div>
            <div className="text-sm">
              最后更新: {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">总连接:</span>
              <span className="text-white font-semibold">{connectionData.totalConnections}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">活跃模块:</span>
              <span className="text-white font-semibold">{moduleData.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">API调用:</span>
              <span className="text-white font-semibold">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.totalCalls : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
