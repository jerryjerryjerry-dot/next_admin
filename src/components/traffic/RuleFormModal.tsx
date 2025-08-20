"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2, Globe, Smartphone, Database } from "lucide-react";
import type { TrafficRule, TrafficRuleFormData } from "~/types/traffic";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = z.object({
  name: z.string().min(1, "规则名称不能为空").max(100, "规则名称过长"),
  appType: z.enum(["web", "app", "api"], {
    errorMap: () => ({ message: "请选择应用类型" })
  }),
  protocol: z.enum(["http", "https", "tcp", "udp"], {
    errorMap: () => ({ message: "请选择协议类型" })
  }),
  targetIp: z.string().ip("请输入有效的IP地址"),
  priority: z.number().min(1, "优先级最小为1").max(100, "优先级最大为100")
});

type FormData = TrafficRuleFormData;

interface RuleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TrafficRuleFormData) => void;
  editingRule?: TrafficRule | null;
  loading?: boolean;
}

const appTypeOptions = [
  { value: "web", label: "Web应用", icon: Globe, description: "网站、Web应用程序" },
  { value: "app", label: "移动应用", icon: Smartphone, description: "手机App、移动端应用" },
  { value: "api", label: "API服务", icon: Database, description: "后端API、微服务接口" },
];

const protocolOptions = [
  { value: "http", label: "HTTP", description: "超文本传输协议" },
  { value: "https", label: "HTTPS", description: "安全超文本传输协议" },
  { value: "tcp", label: "TCP", description: "传输控制协议" },
  { value: "udp", label: "UDP", description: "用户数据报协议" },
];

export function RuleFormModal({ 
  open, 
  onClose, 
  onSubmit, 
  editingRule, 
  loading = false 
}: RuleFormModalProps) {
  const [priorityValue, setPriorityValue] = useState(50);

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      appType: "web",
      protocol: "http",
      targetIp: "",
      priority: 50,
    },
  });

  // 当编辑规则时，填充表单数据
  useEffect(() => {
    if (editingRule) {
      form.reset({
        name: editingRule.name,
        appType: editingRule.appType,
        protocol: editingRule.protocol,
        targetIp: editingRule.targetIp,
        priority: editingRule.priority,
      });
      setPriorityValue(editingRule.priority);
    } else {
      form.reset({
        name: "",
        appType: "web",
        protocol: "http",
        targetIp: "",
        priority: 50,
      });
      setPriorityValue(50);
    }
  }, [editingRule, form]);

  const handleSubmit = (data: TrafficRuleFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    setPriorityValue(50);
    onClose();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "text-red-600";
    if (priority >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return "高优先级";
    if (priority >= 50) return "中优先级";
    return "低优先级";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "编辑流量规则" : "新建流量规则"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本信息</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规则名称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="输入规则名称，如：Web服务_prod_001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      建议使用描述性名称，包含应用类型和环境信息
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用类型 *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择应用类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {appTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <option.icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="protocol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>协议类型 *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择协议类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {protocolOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-gray-500">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 网络配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">网络配置</h3>
              
              <FormField
                control={form.control}
                name="targetIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标IP地址 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="192.168.1.100 或 10.0.0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      支持IPv4和IPv6地址格式
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>优先级 *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={priorityValue}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setPriorityValue(value);
                              field.onChange(value);
                            }}
                            className="w-20"
                          />
                          <span className={`text-sm font-medium ${getPriorityColor(priorityValue)}`}>
                            {getPriorityLabel(priorityValue)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={priorityValue}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setPriorityValue(value);
                            field.onChange(value);
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>低优先级 (1)</span>
                          <span>中优先级 (50)</span>
                          <span>高优先级 (100)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      数值越高优先级越高，高优先级规则会优先执行
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRule ? "更新规则" : "创建规则"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
