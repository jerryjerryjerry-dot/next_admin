"use client";

import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface PandaTechChartProps {
  title: string;
  data: Array<{
    timestamp: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    responseTime: number;
  }>;
  width?: number;
  height?: number;
  className?: string;
}

export const PandaTechChart: React.FC<PandaTechChartProps> = ({
  title,
  data,
  width = 800,
  height = 300,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置高DPI显示
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 熊猫科技风格背景
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
    backgroundGradient.addColorStop(0, "rgba(15, 23, 42, 0.95)"); // 深灰蓝
    backgroundGradient.addColorStop(0.3, "rgba(30, 41, 59, 0.9)"); // 中等灰蓝
    backgroundGradient.addColorStop(0.7, "rgba(51, 65, 85, 0.8)"); // 浅灰蓝
    backgroundGradient.addColorStop(1, "rgba(71, 85, 105, 0.7)"); // 更浅灰蓝
    
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制配置
    const padding = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 绘制熊猫风格网格
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)"; // 浅灰色网格
    ctx.lineWidth = 1;
    
    // 垂直网格线 - 添加发光效果
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (chartWidth * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      
      if (i % 2 === 0) {
        ctx.shadowColor = "rgba(148, 163, 184, 0.5)";
        ctx.shadowBlur = 3;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      }
      ctx.stroke();
    }

    // 水平网格线
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      
      if (i === 0 || i === 5) {
        ctx.shadowColor = "rgba(148, 163, 184, 0.5)";
        ctx.shadowBlur = 3;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 计算数据范围
    const maxCalls = Math.max(...data.map(d => d.totalCalls)) || 1;
    const maxResponseTime = Math.max(...data.map(d => d.responseTime)) || 1;

    // 绘制成功调用量线条 (绿色 - 熊猫友好)
    const drawPandaLine = (points: number[], color: string, shadowColor: string, label: string, thickness = 3) => {
      if (points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      points.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (points.length - 1);
        const y = padding.top + chartHeight - (value / maxCalls) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // 添加渐变填充
      ctx.shadowBlur = 0;
      ctx.beginPath();
      points.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (points.length - 1);
        const y = padding.top + chartHeight - (value / maxCalls) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      fillGradient.addColorStop(0, color.replace('1)', '0.3)'));
      fillGradient.addColorStop(1, color.replace('1)', '0.05)'));
      ctx.fillStyle = fillGradient;
      ctx.fill();
    };

    // 绘制响应时间线条 (黄色 - 熊猫警示色)
    const drawResponseTimeLine = (points: number[]) => {
      if (points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = "rgba(251, 191, 36, 1)"; // 黄色
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
      ctx.shadowBlur = 6;
      ctx.setLineDash([5, 5]);

      points.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (points.length - 1);
        const y = padding.top + chartHeight - (value / maxResponseTime) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    };

    // 绘制数据线
    const successfulCalls = data.map(d => d.successfulCalls);
    const failedCalls = data.map(d => d.failedCalls);
    const responseTimes = data.map(d => d.responseTime);

    drawPandaLine(successfulCalls, "rgba(34, 197, 94, 1)", "rgba(34, 197, 94, 0.8)", "成功调用");
    drawPandaLine(failedCalls, "rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0.8)", "失败调用", 2);
    drawResponseTimeLine(responseTimes);

    // 绘制数据点
    successfulCalls.forEach((value, index) => {
      const x = padding.left + (chartWidth * index) / (successfulCalls.length - 1);
      const y = padding.top + chartHeight - (value / maxCalls) * chartHeight;
      
      // 外圈发光
      ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(34, 197, 94, 1)";
      ctx.fill();
      
      // 内圈白点
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    });

    // 绘制Y轴标签 (左侧 - 调用次数)
    ctx.fillStyle = "rgba(203, 213, 225, 0.9)"; // 浅灰色文字
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
    ctx.textAlign = "right";
    
    for (let i = 0; i <= 5; i++) {
      const value = (maxCalls * (5 - i)) / 5;
      const y = padding.top + (chartHeight * i) / 5;
      ctx.fillText(value.toLocaleString(), padding.left - 10, y + 4);
    }

    // 绘制Y轴标签 (右侧 - 响应时间)
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(251, 191, 36, 0.9)"; // 黄色文字
    
    for (let i = 0; i <= 5; i++) {
      const value = (maxResponseTime * (5 - i)) / 5;
      const y = padding.top + (chartHeight * i) / 5;
      ctx.fillText(`${value.toFixed(0)}ms`, padding.left + chartWidth + 10, y + 4);
    }

    // 绘制时间轴标签
    ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
    ctx.textAlign = "center";
    
    const timeStep = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += timeStep) {
      const x = padding.left + (chartWidth * i) / (data.length - 1);
      const time = new Date(data[i]?.timestamp ?? 0);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillText(timeStr, x, height - 20);
    }

    // 绘制熊猫科技风格图例
    const legendItems = [
      { color: "rgba(34, 197, 94, 1)", label: "成功调用", shadow: "rgba(34, 197, 94, 0.8)" },
      { color: "rgba(239, 68, 68, 1)", label: "失败调用", shadow: "rgba(239, 68, 68, 0.8)" },
      { color: "rgba(251, 191, 36, 1)", label: "响应时间", shadow: "rgba(251, 191, 36, 0.8)" }
    ];

    legendItems.forEach((item, index) => {
      const x = 20;
      const y = 20 + index * 25;
      
      // 图例圆点发光效果
      ctx.shadowColor = item.shadow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + 6, y + 6, 4, 0, 2 * Math.PI);
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // 图例文字
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(248, 250, 252, 0.95)"; // 接近白色
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 18, y + 10);
    });

  }, [data, width, height]);

  return (
    <Card className={`relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 ${className}`}>
      {/* 熊猫科技背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10"></div>
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-blue-400/10 to-transparent rounded-full blur-xl"></div>
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
          </div>
          <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent font-bold">
            {title}
          </span>
        </CardTitle>
        <p className="text-sm text-slate-400 ml-13">实时监控各模块API调用状态与响应时间</p>
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
