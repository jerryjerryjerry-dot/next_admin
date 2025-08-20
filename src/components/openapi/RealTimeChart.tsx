"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface ChartDataPoint {
  timestamp: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  responseTime: number;
}

interface RealTimeChartProps {
  title: string;
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
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

    // 绘制配置
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

    // 计算数据范围
    const maxCalls = Math.max(...data.map(d => d.totalCalls)) || 1;
    const maxResponseTime = Math.max(...data.map(d => d.responseTime)) || 1;

    // 绘制调用量线条
    const drawCallsLine = (points: number[], color: string, label: string) => {
      if (points.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (points.length - 1);
        const y = padding.top + chartHeight - (chartHeight * value) / maxCalls;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // 绘制数据点
      ctx.fillStyle = color;
      points.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (points.length - 1);
        const y = padding.top + chartHeight - (chartHeight * value) / maxCalls;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // 绘制不同类型的调用量
    drawCallsLine(data.map(d => d.totalCalls), "#3b82f6", "总调用");
    drawCallsLine(data.map(d => d.successfulCalls), "#10b981", "成功调用");
    drawCallsLine(data.map(d => d.failedCalls), "#ef4444", "失败调用");

    // 绘制响应时间（右侧Y轴）
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding.left + (chartWidth * index) / (data.length - 1);
      const y = padding.top + chartHeight - (chartHeight * point.responseTime) / maxResponseTime;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制标题
    ctx.fillStyle = "#374151";
    ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, 25);

    // 绘制Y轴标签（左侧 - 调用量）
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#6b7280";
    
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxCalls * (5 - i)) / 5);
      const y = padding.top + (chartHeight * i) / 5;
      ctx.fillText(value.toLocaleString(), padding.left - 10, y + 4);
    }

    // 绘制Y轴标签（右侧 - 响应时间）
    ctx.textAlign = "left";
    ctx.fillStyle = "#f59e0b";
    
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxResponseTime * (5 - i)) / 5);
      const y = padding.top + (chartHeight * i) / 5;
      ctx.fillText(`${value}ms`, padding.left + chartWidth + 10, y + 4);
    }

    // 绘制X轴时间标签
    ctx.textAlign = "center";
    ctx.fillStyle = "#6b7280";
    
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

    // 绘制图例
    const legendItems = [
      { color: "#3b82f6", label: "总调用" },
      { color: "#10b981", label: "成功" },
      { color: "#ef4444", label: "失败" },
      { color: "#f59e0b", label: "响应时间" },
    ];

    legendItems.forEach((item, index) => {
      const x = padding.left + index * 80;
      const y = height - 40;
      
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, 12, 12);
      
      ctx.fillStyle = "#374151";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 18, y + 9);
    });

  }, [data, width, height, title]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="border rounded-lg bg-white"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </CardContent>
    </Card>
  );
};
