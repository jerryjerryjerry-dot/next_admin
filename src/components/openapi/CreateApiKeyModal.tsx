import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Copy, Key, Shield, Clock, Zap } from "lucide-react";
import { createApiKeySchema, type CreateApiKeyRequest, API_PERMISSION_TEMPLATES } from "~/types/openapi";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

interface CreateApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateApiKeyModal({ open, onOpenChange, onSuccess }: CreateApiKeyModalProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<"custom" | "readonly" | "standard" | "admin">("standard");
  const [showSecret, setShowSecret] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    accessKeyId: string;
    accessKeySecret: string;
  } | null>(null);

  const form = useForm<CreateApiKeyRequest>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      keyName: "",
      purpose: "",
      permissions: [],
      quotaLimit: undefined,
      expiresAt: undefined,
    },
  });

  const createKeyMutation = api.openApi.keys.create.useMutation({
    onSuccess: (data) => {
      setCreatedKey({
        accessKeyId: data.accessKeyId,
        accessKeySecret: data.accessKeySecret,
      });
      setShowSecret(true);
      toast({
        title: "密钥创建成功",
        description: "请立即复制并保存您的密钥，这是唯一显示机会。",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTemplateChange = (template: typeof selectedTemplate) => {
    setSelectedTemplate(template);
    if (template !== "custom") {
      const permissions = API_PERMISSION_TEMPLATES[template].map(
        (perm) => `${perm.category}:${perm.endpoints.join(",")}`
      );
      form.setValue("permissions", permissions);
    }
  };

  const onSubmit = (data: CreateApiKeyRequest) => {
    createKeyMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    // 重置表单和状态
    form.reset();
    setSelectedTemplate("standard");
    setShowSecret(false);
    setCreatedKey(null);
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "已复制",
        description: "内容已复制到剪贴板",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            创建API密钥
          </DialogTitle>
          <DialogDescription>
            创建新的API访问密钥，用于调用系统接口
          </DialogDescription>
        </DialogHeader>

        {showSecret && createdKey ? (
          // 显示创建成功的密钥
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">密钥创建成功</span>
              </div>
              <p className="text-green-700 text-sm">
                请立即复制并保存您的密钥信息，窗口关闭后将无法再次查看密钥。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>AccessKey ID</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    value={createdKey.accessKeyId} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdKey.accessKeyId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>AccessKey Secret</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    value={createdKey.accessKeySecret} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdKey.accessKeySecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  copyToClipboard(`AccessKey ID: ${createdKey.accessKeyId}\nAccessKey Secret: ${createdKey.accessKeySecret}`);
                }}
                variant="outline"
              >
                复制全部
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          </div>
        ) : (
          // 创建表单
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 权限模板选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  权限模板
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries({
                  readonly: { name: "只读权限", desc: "仅查看相关接口" },
                  standard: { name: "标准权限", desc: "常用业务接口访问" },
                  admin: { name: "管理员权限", desc: "全部接口访问权限" },
                  custom: { name: "自定义权限", desc: "手动选择具体权限" },
                }).map(([key, info]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedTemplate === key}
                      onCheckedChange={() => handleTemplateChange(key as typeof selectedTemplate)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-gray-500">{info.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyName">密钥名称 *</Label>
                  <Input
                    id="keyName"
                    placeholder="请输入密钥名称"
                    {...form.register("keyName")}
                  />
                  {form.formState.errors.keyName && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.keyName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="purpose">用途描述 *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="请描述此密钥的用途..."
                    className="min-h-[80px]"
                    {...form.register("purpose")}
                  />
                  {form.formState.errors.purpose && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.purpose.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 配额和过期设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  配额和过期设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quotaLimit">配额限制（次/月）</Label>
                  <Input
                    id="quotaLimit"
                    type="number"
                    placeholder="留空表示无限制"
                    {...form.register("quotaLimit", { valueAsNumber: true })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    设置每月最大调用次数，留空表示无限制
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiresAt">过期时间</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...form.register("expiresAt", {
                      setValueAs: (value: string) => value ? new Date(value) : undefined,
                    })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    留空表示永不过期
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 权限预览 */}
            {selectedTemplate !== "custom" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">权限预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {API_PERMISSION_TEMPLATES[selectedTemplate].map((perm, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {perm.category}: {perm.endpoints.join(", ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={createKeyMutation.isPending}
              >
                {createKeyMutation.isPending ? "创建中..." : "创建密钥"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
