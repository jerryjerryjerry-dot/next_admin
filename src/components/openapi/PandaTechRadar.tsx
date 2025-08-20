"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface ModulePerformanceData {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: "healthy" | "warning" | "error";
}

interface PandaTechRadarProps {
  data: ModulePerformanceData[];
  width?: number;
  height?: number;
}

export const PandaTechRadar: React.FC<PandaTechRadarProps> = ({ 
  data, 
  width = 400, 
  height = 400 
}) => {
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

    // 清除画布并设置熊猫科技背景
    ctx.clearRect(0, 0, width, height);
    
    // 科技感背景渐变
    const backgroundGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.min(width, height)/2);
    backgroundGradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
    backgroundGradient.addColorStop(0.3, "rgba(30, 41, 59, 0.9)");
    backgroundGradient.addColorStop(0.7, "rgba(51, 65, 85, 0.8)");
    backgroundGradient.addColorStop(1, "rgba(71, 85, 105, 0.7)");
    
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 80;

    // 绘制熊猫科技风格同心圆
    const circles = [0.2, 0.4, 0.6, 0.8, 1.0];
    circles.forEach((scale, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * scale, 0, 2 * Math.PI);
      
      // 熊猫配色的圆环
      if (index === circles.length - 1) {
        // 外圆 - 强调边框
        ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(148, 163, 184, 0.6)";
        ctx.shadowBlur = 8;
      } else if (index % 2 === 0) {
        // 偶数圆环 - 浅色
        ctx.strokeStyle = "rgba(203, 213, 225, 0.3)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      } else {
        // 奇数圆环 - 深色
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 绘制科技感网格线
    const angleStep = (2 * Math.PI) / data.length;
    data.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * maxRadius;
      const endY = centerY + Math.sin(angle) * maxRadius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 绘制CPU使用率区域 - 熊猫绿色
    if (data.length > 0) {
      const cpuGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      cpuGradient.addColorStop(0, "rgba(34, 197, 94, 0.4)");  // 绿色中心
      cpuGradient.addColorStop(0.6, "rgba(34, 197, 94, 0.2)");
      cpuGradient.addColorStop(1, "rgba(34, 197, 94, 0.05)");
      
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
      
      // CPU边框 - 发光效果
      ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 绘制内存使用率区域 - 熊猫蓝色
      const memoryGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      memoryGradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");  // 蓝色中心
      memoryGradient.addColorStop(0.6, "rgba(59, 130, 246, 0.2)");
      memoryGradient.addColorStop(1, "rgba(59, 130, 246, 0.05)");
      
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
      
      // 内存边框 - 发光效果
      ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 绘制数据点 - CPU
      data.forEach((module, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const cpuRadius = (module.cpuUsage / 100) * maxRadius;
        const cpuX = centerX + Math.cos(angle) * cpuRadius;
        const cpuY = centerY + Math.sin(angle) * cpuRadius;
        
        // CPU点发光效果
        ctx.shadowColor = "rgba(34, 197, 94, 0.9)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cpuX, cpuY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(34, 197, 94, 1)";
        ctx.fill();
        
        // CPU内圈
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cpuX, cpuY, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fill();
      });

      // 绘制数据点 - 内存
      data.forEach((module, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const memRadius = (module.memoryUsage / 100) * maxRadius;
        const memX = centerX + Math.cos(angle) * memRadius;
        const memY = centerY + Math.sin(angle) * memRadius;
        
        // 内存点发光效果
        ctx.shadowColor = "rgba(59, 130, 246, 0.9)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(memX, memY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(59, 130, 246, 1)";
        ctx.fill();
        
        // 内存内圈
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(memX, memY, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    // 绘制标签和状态指示器
    ctx.fillStyle = "rgba(241, 245, 249, 0.9)"; // 浅色文字
    ctx.font = "13px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
    ctx.textAlign = "center";
    
    data.forEach((module, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = maxRadius + 35;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      // 模块名称
      ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
      ctx.fillText(module.name, labelX, labelY);
      
      // 使用率文字
      ctx.font = "11px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
      ctx.fillText(`CPU: ${module.cpuUsage}%`, labelX, labelY + 15);
      ctx.fillText(`内存: ${module.memoryUsage}%`, labelX, labelY + 28);
      
      // 恢复字体
      ctx.font = "13px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      
      // 状态指示器 - 熊猫状态色
      const statusColors = {
        healthy: "rgba(34, 197, 94, 1)",    // 绿色 - 健康
        warning: "rgba(251, 191, 36, 1)",   // 黄色 - 警告  
        error: "rgba(239, 68, 68, 1)"       // 红色 - 错误
      };
      
      const shadowColors = {
        healthy: "rgba(34, 197, 94, 0.8)",
        warning: "rgba(251, 191, 36, 0.8)", 
        error: "rgba(239, 68, 68, 0.8)"
      };
      
      // 状态点发光效果
      ctx.shadowColor = shadowColors[module.status];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(labelX, labelY + 45, 5, 0, 2 * Math.PI);
      ctx.fillStyle = statusColors[module.status];
      ctx.fill();
      
      // 状态内圈
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(labelX, labelY + 45, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    });

    // 绘制熊猫科技风格图例
    const legendItems = [
      { color: "rgba(34, 197, 94, 1)", label: "CPU使用率", shadow: "rgba(34, 197, 94, 0.8)" },
      { color: "rgba(59, 130, 246, 1)", label: "内存使用率", shadow: "rgba(59, 130, 246, 0.8)" }
    ];

    legendItems.forEach((item, index) => {
      const x = 25;
      const y = height - 50 + index * 22;
      
      // 图例点发光
      ctx.shadowColor = item.shadow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // 图例文字
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 12, y + 4);
    });

    // 中心科技装饰
    ctx.shadowColor = "rgba(148, 163, 184, 0.6)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(71, 85, 105, 0.8)";
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(148, 163, 184, 1)";
    ctx.fill();

  }, [data, width, height]);

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* 熊猫科技背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-400/10 to-transparent rounded-full blur-xl"></div>
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
          </div>
          <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent font-bold">
            模块性能雷达
          </span>
        </CardTitle>
        <p className="text-sm text-slate-400 ml-13">实时监控各模块CPU和内存使用情况</p>
      </CardHeader>
      
      <CardContent className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </CardContent>
      
      {/* 底部科技装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400/30 via-blue-400/30 to-green-400/30"></div>
    </Card>
  );
};
