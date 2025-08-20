"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface PandaTechRingProps {
  totalConnections: number;
  activeConnections: number;
  errorConnections: number;
  width?: number;
  height?: number;
}

export const PandaTechRing: React.FC<PandaTechRingProps> = ({
  totalConnections,
  activeConnections,
  errorConnections,
  width = 350,
  height = 350
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    backgroundGradient.addColorStop(0.4, "rgba(30, 41, 59, 0.9)");
    backgroundGradient.addColorStop(0.8, "rgba(51, 65, 85, 0.8)");
    backgroundGradient.addColorStop(1, "rgba(71, 85, 105, 0.7)");
    
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const ringWidth = 25;

    // 计算各部分比例
    const safeTotal = Math.max(totalConnections, 1);
    const normalConnections = Math.max(0, safeTotal - activeConnections - errorConnections);
    
    const activePercent = (activeConnections / safeTotal) * 100;
    const errorPercent = (errorConnections / safeTotal) * 100;
    const normalPercent = (normalConnections / safeTotal) * 100;

    // 计算角度
    const activeAngle = (activeConnections / safeTotal) * 2 * Math.PI;
    const errorAngle = (errorConnections / safeTotal) * 2 * Math.PI;
    const normalAngle = (normalConnections / safeTotal) * 2 * Math.PI;

    // 绘制背景环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = ringWidth + 4;
    ctx.strokeStyle = "rgba(51, 65, 85, 0.3)";
    ctx.stroke();

    // 绘制内层装饰环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - ringWidth - 8, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.stroke();

    // 绘制外层装饰环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + ringWidth + 8, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(203, 213, 225, 0.2)";
    ctx.stroke();

    // 设置线段端点样式
    ctx.lineCap = "round";

    let currentAngle = -Math.PI / 2; // 从顶部开始

    // 绘制活跃连接 - 熊猫绿色
    if (activeConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + activeAngle);
      ctx.lineWidth = ringWidth;
      
      // 创建渐变效果
      const activeGradient = ctx.createLinearGradient(
        centerX - radius, centerY,
        centerX + radius, centerY
      );
      activeGradient.addColorStop(0, "rgba(34, 197, 94, 1)");
      activeGradient.addColorStop(0.5, "rgba(16, 185, 129, 1)");
      activeGradient.addColorStop(1, "rgba(34, 197, 94, 1)");
      
      ctx.strokeStyle = activeGradient;
      ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
      ctx.shadowBlur = 15;
      ctx.stroke();
      
      currentAngle += activeAngle;
    }

    // 绘制错误连接 - 熊猫红色
    if (errorConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + errorAngle);
      ctx.lineWidth = ringWidth;
      
      const errorGradient = ctx.createLinearGradient(
        centerX - radius, centerY,
        centerX + radius, centerY
      );
      errorGradient.addColorStop(0, "rgba(239, 68, 68, 1)");
      errorGradient.addColorStop(0.5, "rgba(220, 38, 38, 1)");
      errorGradient.addColorStop(1, "rgba(239, 68, 68, 1)");
      
      ctx.strokeStyle = errorGradient;
      ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      ctx.shadowBlur = 15;
      ctx.stroke();
      
      currentAngle += errorAngle;
    }

    // 绘制正常连接 - 熊猫灰色
    if (normalConnections > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + normalAngle);
      ctx.lineWidth = ringWidth;
      
      const normalGradient = ctx.createLinearGradient(
        centerX - radius, centerY,
        centerX + radius, centerY
      );
      normalGradient.addColorStop(0, "rgba(148, 163, 184, 1)");
      normalGradient.addColorStop(0.5, "rgba(203, 213, 225, 1)");
      normalGradient.addColorStop(1, "rgba(148, 163, 184, 1)");
      
      ctx.strokeStyle = normalGradient;
      ctx.shadowColor = "rgba(148, 163, 184, 0.6)";
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    // 清除阴影
    ctx.shadowBlur = 0;

    // 绘制中心数字
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // 总连接数
    ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
    ctx.fillText(totalConnections.toString(), centerX, centerY - 15);
    
    // 连接文字
    ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
    ctx.fillText("总连接", centerX, centerY + 15);

    // 绘制指示器和百分比
    const indicators = [
      { 
        angle: -Math.PI / 2 + activeAngle / 2, 
        color: "rgba(34, 197, 94, 1)", 
        value: activeConnections,
        percent: activePercent,
        label: "活跃",
        shadowColor: "rgba(34, 197, 94, 0.8)"
      },
      { 
        angle: -Math.PI / 2 + activeAngle + errorAngle / 2, 
        color: "rgba(239, 68, 68, 1)", 
        value: errorConnections,
        percent: errorPercent,
        label: "异常",
        shadowColor: "rgba(239, 68, 68, 0.8)"
      },
      { 
        angle: -Math.PI / 2 + activeAngle + errorAngle + normalAngle / 2, 
        color: "rgba(148, 163, 184, 1)", 
        value: normalConnections,
        percent: normalPercent,
        label: "正常",
        shadowColor: "rgba(148, 163, 184, 0.6)"
      }
    ].filter(indicator => indicator.value > 0);

    indicators.forEach((indicator) => {
      // 指示器圆点
      const indicatorRadius = radius + 40;
      const indicatorX = centerX + Math.cos(indicator.angle) * indicatorRadius;
      const indicatorY = centerY + Math.sin(indicator.angle) * indicatorRadius;
      
      // 外发光
      ctx.shadowColor = indicator.shadowColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = indicator.color;
      ctx.fill();
      
      // 内圈
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      
      // 标签文字
      const labelRadius = radius + 65;
      const labelX = centerX + Math.cos(indicator.angle) * labelRadius;
      const labelY = centerY + Math.sin(indicator.angle) * labelRadius;
      
      ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(indicator.label, labelX, labelY - 8);
      
      ctx.fillStyle = indicator.color;
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.fillText(`${indicator.value}`, labelX, labelY + 6);
      
      ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
      ctx.font = "11px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      ctx.fillText(`${indicator.percent.toFixed(1)}%`, labelX, labelY + 18);
    });

    // 中心装饰
    ctx.shadowColor = "rgba(148, 163, 184, 0.6)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(71, 85, 105, 0.8)";
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(148, 163, 184, 1)";
    ctx.fill();

    // 绘制旋转的科技装饰环
    const decorationRadius = radius - 45;
    const decorationCount = 12;
    const rotationSpeed = Date.now() * 0.001; // 缓慢旋转

    for (let i = 0; i < decorationCount; i++) {
      const angle = (i / decorationCount) * 2 * Math.PI + rotationSpeed;
      const x = centerX + Math.cos(angle) * decorationRadius;
      const y = centerY + Math.sin(angle) * decorationRadius;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(148, 163, 184, ${0.3 + 0.3 * Math.sin(angle * 3)})`;
      ctx.fill();
    }

  }, [totalConnections, activeConnections, errorConnections, width, height]);

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* 熊猫科技背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10"></div>
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-red-400/10 to-transparent rounded-full blur-xl"></div>
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-red-400 rounded-full animate-pulse"></div>
          </div>
          <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent font-bold">
            连接状态分布
          </span>
        </CardTitle>
        <p className="text-sm text-slate-400 ml-13">系统连接数量和状态实时统计</p>
      </CardHeader>
      
      <CardContent className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </CardContent>
      
      {/* 底部科技装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400/30 via-red-400/30 to-green-400/30"></div>
    </Card>
  );
};
