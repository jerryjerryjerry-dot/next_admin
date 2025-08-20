"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// 系统模块性能数据类型
interface ModulePerformanceData {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  connections: number;
  status: 'healthy' | 'warning' | 'error';
  timestamp: number;
}

// 资源使用历史数据类型
interface ResourceHistoryData {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

// 实时模块性能雷达图
export const ModulePerformanceRadar: React.FC<{
  data: ModulePerformanceData[];
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 高DPI支持
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 60;

    // 绘制背景同心圆 - 增强视觉效果
    const circles = [0.2, 0.4, 0.6, 0.8, 1.0];
    circles.forEach((scale, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * scale, 0, 2 * Math.PI);
      
      // 添加渐变效果
      if (index === circles.length - 1) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 5;
      } else {
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 + index * 0.1})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 绘制网格线 - 增强视觉效果
    const angleStep = (2 * Math.PI) / data.length;
    data.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * maxRadius;
      const endY = centerY + Math.sin(angle) * maxRadius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 绘制模块数据
    if (data.length > 0) {
      // CPU使用率 - 添加渐变和发光效果
      const cpuGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      cpuGradient.addColorStop(0, "rgba(59, 130, 246, 0.6)");
      cpuGradient.addColorStop(1, "rgba(59, 130, 246, 0.1)");
      
      ctx.beginPath();
      data.forEach((module, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const radius = (module.cpuUsage / 100) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = cpuGradient;
      ctx.fill();
      
      // CPU边框发光效果
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 内存使用率 - 添加渐变和发光效果
      const memoryGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      memoryGradient.addColorStop(0, "rgba(16, 185, 129, 0.6)");
      memoryGradient.addColorStop(1, "rgba(16, 185, 129, 0.1)");
      
      ctx.beginPath();
      data.forEach((module, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const radius = (module.memoryUsage / 100) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = memoryGradient;
      ctx.fill();
      
      // 内存边框发光效果
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 绘制数据点 - 增强发光效果
      data.forEach((module, index) => {
        const angle = index * angleStep - Math.PI / 2;
        
        // CPU点 - 发光效果
        const cpuRadius = (module.cpuUsage / 100) * maxRadius;
        const cpuX = centerX + Math.cos(angle) * cpuRadius;
        const cpuY = centerY + Math.sin(angle) * cpuRadius;
        
        // 外发光
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cpuX, cpuY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        
        // 内白点
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cpuX, cpuY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // 内存点 - 发光效果
        const memRadius = (module.memoryUsage / 100) * maxRadius;
        const memX = centerX + Math.cos(angle) * memRadius;
        const memY = centerY + Math.sin(angle) * memRadius;
        
        // 外发光
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(memX, memY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        
        // 内白点
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(memX, memY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    // 绘制标签
    ctx.fillStyle = "#374151";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    
    data.forEach((module, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = maxRadius + 30;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      ctx.fillText(module.name, labelX, labelY);
      
      // 状态指示器 - 增强发光效果
      const statusColors = {
        healthy: "#10b981",
        warning: "#f59e0b", 
        error: "#ef4444"
      };
      
      // 外发光
      ctx.shadowColor = statusColors[module.status];
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(labelX, labelY + 15, 4, 0, 2 * Math.PI);
      ctx.fillStyle = statusColors[module.status];
      ctx.fill();
      
      // 内白点
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(labelX, labelY + 15, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });

    // 绘制图例
    const legendItems = [
      { color: "#3b82f6", label: "CPU使用率" },
      { color: "#10b981", label: "内存使用率" }
    ];

    legendItems.forEach((item, index) => {
      const x = 20;
      const y = height - 40 + index * 20;
      
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, 12, 12);
      
      ctx.fillStyle = "#374151";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 18, y + 9);
    });

  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg bg-white"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

// 系统资源使用趋势图
export const ResourceUsageTrend: React.FC<{
  data: ResourceHistoryData[];
  width?: number;
  height?: number;
}> = ({ data, width = 600, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 40, right: 60, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 绘制背景网格
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (chartWidth * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    // 水平网格线
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // 绘制资源使用趋势线
    const drawTrendLine = (values: number[], color: string, label: string) => {
      if (values.length < 2) return;

      // 创建渐变
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, color + "40"); // 40% 透明度
      gradient.addColorStop(1, color + "10"); // 10% 透明度

      // 绘制面积
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (values.length - 1);
        const y = padding.top + chartHeight - (chartHeight * value) / 100;
        
        if (index === 0) {
          ctx.moveTo(x, padding.top + chartHeight);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制线条
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (values.length - 1);
        const y = padding.top + chartHeight - (chartHeight * value) / 100;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 绘制数据点
      ctx.fillStyle = color;
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (values.length - 1);
        const y = padding.top + chartHeight - (chartHeight * value) / 100;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // 添加白色边框
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    // 绘制各项资源
    drawTrendLine(data.map(d => d.cpu), "#ef4444", "CPU");
    drawTrendLine(data.map(d => d.memory), "#3b82f6", "内存");
    drawTrendLine(data.map(d => d.disk), "#f59e0b", "磁盘");
    drawTrendLine(data.map(d => d.network), "#10b981", "网络");

    // Y轴标签
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    
    for (let i = 0; i <= 5; i++) {
      const value = 100 - (i * 20);
      const y = padding.top + (chartHeight * i) / 5;
      ctx.fillText(`${value}%`, padding.left - 10, y + 4);
    }

    // X轴时间标签
    ctx.textAlign = "center";
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 6) === 0) {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const time = new Date(point.timestamp).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(time, x, height - 20);
      }
    });

    // 图例
    const legendItems = [
      { color: "#ef4444", label: "CPU" },
      { color: "#3b82f6", label: "内存" },
      { color: "#f59e0b", label: "磁盘" },
      { color: "#10b981", label: "网络" }
    ];

    legendItems.forEach((item, index) => {
      const x = padding.left + index * 80;
      const y = 20;
      
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, 12, 12);
      
      ctx.fillStyle = "#374151";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 18, y + 9);
    });

  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg bg-white"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

// 连接状态可视化圆环图
export const ConnectionStatusRing: React.FC<{
  totalConnections: number;
  activeConnections: number;
  errorConnections: number;
  width?: number;
  height?: number;
}> = ({ totalConnections, activeConnections, errorConnections, width = 300, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 20;
    const innerRadius = outerRadius - 30;

    const idleConnections = totalConnections - activeConnections - errorConnections;

    // 计算角度
    const activeAngle = (activeConnections / totalConnections) * 2 * Math.PI;
    const errorAngle = (errorConnections / totalConnections) * 2 * Math.PI;
    const idleAngle = (idleConnections / totalConnections) * 2 * Math.PI;

    let currentAngle = -Math.PI / 2; // 从顶部开始

    // 绘制活跃连接
    if (activeConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + activeAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + activeAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = "#10b981";
      ctx.fill();
      
      // 添加发光效果
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      currentAngle += activeAngle;
    }

    // 绘制错误连接
    if (errorConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + errorAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + errorAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      
      // 添加发光效果
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      currentAngle += errorAngle;
    }

    // 绘制空闲连接
    if (idleConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + idleAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + idleAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = "#6b7280";
      ctx.fill();
      
      currentAngle += idleAngle;
    }

    // 中心文字
    ctx.fillStyle = "#374151";
    ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(totalConnections.toString(), centerX, centerY - 5);
    
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("总连接", centerX, centerY + 15);

    // 绘制状态标签
    const labels = [
      { value: activeConnections, label: "活跃", color: "#10b981", angle: -Math.PI / 2 + activeAngle / 2 },
      { value: errorConnections, label: "错误", color: "#ef4444", angle: -Math.PI / 2 + activeAngle + errorAngle / 2 },
      { value: idleConnections, label: "空闲", color: "#6b7280", angle: -Math.PI / 2 + activeAngle + errorAngle + idleAngle / 2 }
    ];

    labels.forEach((label) => {
      if (label.value > 0) {
        const labelRadius = outerRadius + 25;
        const labelX = centerX + Math.cos(label.angle) * labelRadius;
        const labelY = centerY + Math.sin(label.angle) * labelRadius;
        
        ctx.fillStyle = label.color;
        ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${label.label} ${label.value}`, labelX, labelY);
      }
    });

  }, [totalConnections, activeConnections, errorConnections, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg bg-white"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

// 综合系统监控面板
export const SystemMonitorDashboard: React.FC<{
  moduleData: ModulePerformanceData[];
  resourceData: ResourceHistoryData[];
  connectionData: {
    totalConnections: number;
    activeConnections: number;
    errorConnections: number;
  };
}> = ({ moduleData, resourceData, connectionData }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 模块性能雷达图 */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                模块性能雷达
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 ml-11">实时监控各模块CPU和内存使用情况</p>
          </CardHeader>
          <CardContent className="relative">
            <ModulePerformanceRadar data={moduleData} width={400} height={400} />
          </CardContent>
        </Card>

        {/* 连接状态圆环图 */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-green-50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-400/5"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                连接状态分布
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 ml-11">系统连接数量和状态实时统计</p>
          </CardHeader>
          <CardContent className="relative flex items-center justify-center">
            <ConnectionStatusRing 
              {...connectionData}
              width={320} 
              height={320} 
            />
          </CardContent>
        </Card>
      </div>

      {/* 资源使用趋势图 */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-amber-400/5"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
              系统资源趋势
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600 ml-11">CPU、内存、磁盘、网络使用率实时曲线</p>
        </CardHeader>
        <CardContent className="relative">
          <ResourceUsageTrend data={resourceData} width={800} height={380} />
        </CardContent>
      </Card>
    </div>
  );
};
