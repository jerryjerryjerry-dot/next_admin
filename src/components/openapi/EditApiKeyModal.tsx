import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Key, Settings, Clock, Shield } from "lucide-react";
import { updateApiKeySchema, type UpdateApiKeyRequest, type ApiKeyTableRow } from "~/types/openapi";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

interface EditApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKeyTableRow | null;
  onSuccess?: () => void;
}

export function EditApiKeyModal({ open, onOpenChange, apiKey, onSuccess }: EditApiKeyModalProps) {
  const { toast } = useToast();

  const form = useForm<UpdateApiKeyRequest>({
    resolver: zodResolver(updateApiKeySchema),
    defaultValues: {
      id: "",
      keyName: "",
      purpose: "",
      permissions: [],
      quotaLimit: undefined,
      status: "active",
      expiresAt: undefined,
    },
  });

  const updateKeyMutation = api.openApi.keys.update.useMutation({
    onSuccess: () => {
      toast({
        title: "密钥更新成功",
        description: "API密钥信息已更新",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 当密钥数据变化时重置表单
  useEffect(() => {
    if (apiKey) {
      form.reset({
        id: apiKey.id,
        keyName: apiKey.keyName,
        purpose: apiKey.purpose,
        permissions: JSON.parse(apiKey.permissions || "[]") as string[],
        quotaLimit: apiKey.quotaLimit ?? undefined,
        status: apiKey.status as "active" | "inactive" | "expired",
        expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt) : undefined,
      });
    }
  }, [apiKey, form]);

  const onSubmit = (data: UpdateApiKeyRequest) => {
    updateKeyMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            编辑API密钥
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Label htmlFor="keyName">密钥名称</Label>
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
                <Label htmlFor="purpose">密钥用途</Label>
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

              <div>
                <Label>AccessKey ID</Label>
                <div className="mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded-md text-sm block">
                    {apiKey.accessKeyId}
                  </code>
                  <p className="text-sm text-gray-500 mt-1">
                    AccessKey ID 无法修改
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 状态和配额 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                状态和配额
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">密钥状态</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as "active" | "inactive" | "expired")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quotaLimit">配额限制（次/月）</Label>
                <Input
                  id="quotaLimit"
                  type="number"
                  placeholder="留空表示无限制"
                  {...form.register("quotaLimit", { 
                    setValueAs: (value) => value === "" || value === null ? undefined : Number(value)
                  })}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500">
                    当前已使用: {apiKey.quotaUsed} 次
                  </p>
                  {apiKey.quotaLimit && (
                    <p className="text-sm text-gray-500">
                      使用率: {apiKey.quotaUsagePercent}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 过期时间 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                过期设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expiresAt">过期时间</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={
                    form.watch("expiresAt") 
                      ? new Date(form.watch("expiresAt")!).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    form.setValue("expiresAt", value ? new Date(value) : undefined);
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  留空表示永不过期
                </p>
                {apiKey.isExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                    <p className="text-red-800 text-sm">
                      此密钥已过期，请更新过期时间或将状态改为启用
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 当前权限 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">当前权限</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {apiKey.permissionLabels?.map((perm, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                )) ?? (
                  <p className="text-gray-500 text-sm">无权限信息</p>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                权限配置需要重新创建密钥才能修改
              </p>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={updateKeyMutation.isPending}
            >
              {updateKeyMutation.isPending ? "更新中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
