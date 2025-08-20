"use client";

import { useState } from "react";
import { 
  Shield, 
  BarChart3, 
  Settings, 
  FileText, 
  Activity
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { WatermarkProcess } from "~/components/watermark/watermark-process";
import { PolicyManagement } from "~/components/watermark/policy-management";
import { RecordManagement } from "~/components/watermark/record-management";
import { StatsDashboard } from "~/components/watermark/stats-dashboard";

export function WatermarkPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* 标签导航 */}
      <TabsList className="grid w-full grid-cols-4 bg-gray-100">
        <TabsTrigger value="dashboard" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>仪表盘</span>
        </TabsTrigger>
        <TabsTrigger value="process" className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>文件处理</span>
        </TabsTrigger>
        <TabsTrigger value="policies" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>策略管理</span>
        </TabsTrigger>
        <TabsTrigger value="records" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>处理记录</span>
        </TabsTrigger>
        {/* <TabsTrigger value="settings" className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>系统设置</span>
        </TabsTrigger> */}
      </TabsList>

      {/* 仪表盘页面 */}
      <TabsContent value="dashboard" className="space-y-6">
        <StatsDashboard onTabChange={setActiveTab} />
      </TabsContent>

      {/* 文件处理页面 */}
      <TabsContent value="process" className="space-y-6">
        <WatermarkProcess />
      </TabsContent>

      {/* 策略管理页面 */}
      <TabsContent value="policies" className="space-y-6">
        <PolicyManagement />
      </TabsContent>

      {/* 处理记录页面 */}
      <TabsContent value="records" className="space-y-6">
        <RecordManagement />
      </TabsContent>

      {/* 系统设置页面 */}
      <TabsContent value="settings" className="space-y-6">
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">系统设置</h3>
          <p className="text-gray-600">系统配置功能开发中...</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}