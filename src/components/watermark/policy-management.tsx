import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings, Search, Power, PowerOff, Eye, Copy, Download, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { useToast } from "~/hooks/use-toast";

interface WatermarkPolicy {
  id: string;
  name: string;
  description: string;
  watermarkText: string;
  opacity: number;
  fontSize: number;
  color: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyFormData {
  name: string;
  description: string;
  watermarkText: string;
  opacity: number;
  fontSize: number;
  color: string;
  position: string;
  isActive?: boolean;
}

const defaultFormData: PolicyFormData = {
  name: "",
  description: "",
  watermarkText: "",
  opacity: 0.3,
  fontSize: 24,
  color: "#666666",
  position: "center",
};

export function PolicyManagement() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<WatermarkPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<WatermarkPolicy | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>(defaultFormData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPolicy, setPreviewPolicy] = useState<WatermarkPolicy | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 获取策略列表
  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/watermark/policies');
      const result = await response.json() as {
        success: boolean;
        data: WatermarkPolicy[];
      };

      if (result.success) {
        setPolicies(result.data);
      }
    } catch (error) {
      console.error('获取策略列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPolicies();
  }, []);

  // 创建策略
  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('/api/watermark/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "策略创建成功",
          variant: "success",
        });
        setIsCreateDialogOpen(false);
        setFormData(defaultFormData);
        await fetchPolicies();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 更新策略
  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;

    try {
      const response = await fetch(`/api/watermark/policies/${editingPolicy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "策略更新成功",
          variant: "success",
        });
        setEditingPolicy(null);
        setFormData(defaultFormData);
        await fetchPolicies();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 删除策略
  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('确定要删除这个策略吗？')) return;

    try {
      const response = await fetch(`/api/watermark/policies/${policyId}`, {
        method: 'DELETE',
      });

      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "策略删除成功",
          variant: "success",
        });
        await fetchPolicies();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 切换策略状态
  const handleToggleStatus = async (policyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/watermark/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: `策略已${!currentStatus ? '启用' : '禁用'}`,
          variant: "success",
        });
        await fetchPolicies();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "状态切换失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 复制策略
  const handleCopyPolicy = async (policy: WatermarkPolicy) => {
    const copiedPolicy = {
      ...policy,
      name: `${policy.name} (副本)`,
      id: undefined // 让后端生成新ID
    };
    
    try {
      const response = await fetch('/api/watermark/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(copiedPolicy),
      });

      const result = await response.json() as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "策略复制成功",
          variant: "success",
        });
        await fetchPolicies();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "复制失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 预览策略
  const handlePreviewPolicy = (policy: WatermarkPolicy) => {
    setPreviewPolicy(policy);
    setIsPreviewOpen(true);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedPolicies.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedPolicies.length} 个策略吗？`)) return;

    try {
      const deletePromises = selectedPolicies.map(id =>
        fetch(`/api/watermark/policies/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: `成功删除 ${selectedPolicies.length} 个策略`,
        variant: "success",
      });
      
      setSelectedPolicies([]);
      await fetchPolicies();
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 批量启用/禁用
  const handleBatchToggle = async (enable: boolean) => {
    if (selectedPolicies.length === 0) return;

    try {
      const updatePromises = selectedPolicies.map(id =>
        fetch(`/api/watermark/policies/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: enable })
        })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: `成功${enable ? '启用' : '禁用'} ${selectedPolicies.length} 个策略`,
        variant: "success",
      });
      
      setSelectedPolicies([]);
      await fetchPolicies();
    } catch (error) {
      toast({
        title: `批量${enable ? '启用' : '禁用'}失败`,
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 导出策略
  const handleExportPolicies = async () => {
    setIsExporting(true);
    try {
      const policiesToExport = selectedPolicies.length > 0 
        ? policies.filter(p => selectedPolicies.includes(p.id))
        : policies;

      const exportData = {
        version: "1.0",
        exportTime: new Date().toISOString(),
        policies: policiesToExport.map(policy => ({
          name: policy.name,
          description: policy.description,
          watermarkText: policy.watermarkText,
          opacity: policy.opacity,
          fontSize: policy.fontSize,
          color: policy.color,
          position: policy.position,
          isActive: policy.isActive
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermark-policies-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "导出成功",
        description: `已导出 ${policiesToExport.length} 个策略`,
        variant: "success",
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: "导出失败",
        description: "导出策略时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 导入策略
  const handleImportPolicies = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (!importData.policies || !Array.isArray(importData.policies)) {
          throw new Error('无效的导入文件格式');
        }

        let successCount = 0;
        let errorCount = 0;

        for (const policyData of importData.policies) {
          try {
            await handleCreatePolicy(policyData);
            successCount++;
          } catch (error) {
            console.error('导入策略失败:', error);
            errorCount++;
          }
        }

        await fetchPolicies();
        
        toast({
          title: "导入完成",
          description: `成功导入 ${successCount} 个策略${errorCount > 0 ? `，失败 ${errorCount} 个` : ''}`,
          variant: "success",
        });
      } catch (error) {
        console.error('导入失败:', error);
        toast({
          title: "导入失败",
          description: error instanceof Error ? error.message : "导入策略时发生错误",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  // 开始编辑
  const startEdit = (policy: WatermarkPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      watermarkText: policy.watermarkText,
      opacity: policy.opacity,
      fontSize: policy.fontSize,
      color: policy.color,
      position: policy.position,
      isActive: policy.isActive,
    });
  };

  // 筛选策略
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchKeyword || 
      policy.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      policy.watermarkText.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && policy.isActive) ||
      (statusFilter === "inactive" && !policy.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPolicies(filteredPolicies.map(p => p.id));
    } else {
      setSelectedPolicies([]);
    }
  };

  // 单选策略
  const handleSelectPolicy = (policyId: string, checked: boolean) => {
    if (checked) {
      setSelectedPolicies(prev => [...prev, policyId]);
    } else {
      setSelectedPolicies(prev => prev.filter(id => id !== policyId));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">策略管理</h2>
          <p className="text-gray-600">管理水印策略模板</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建策略
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>创建水印策略</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">策略名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入策略名称"
                />
              </div>
              <div>
                <Label htmlFor="watermarkText">水印文本</Label>
                <Input
                  id="watermarkText"
                  value={formData.watermarkText}
                  onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                  placeholder="请输入水印文本"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入策略描述"
                />
              </div>
              
              {/* 高级配置选项 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opacity">透明度 ({(formData.opacity * 100).toFixed(0)}%)</Label>
                  <input
                    type="range"
                    id="opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.opacity}
                    onChange={(e) => setFormData({ ...formData, opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="fontSize">字体大小 ({formData.fontSize}px)</Label>
                  <input
                    type="range"
                    id="fontSize"
                    min="12"
                    max="48"
                    step="2"
                    value={formData.fontSize}
                    onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">颜色</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-8 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="position">位置</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">居中</SelectItem>
                      <SelectItem value="diagonal">对角线</SelectItem>
                      <SelectItem value="corner">角落</SelectItem>
                      <SelectItem value="repeat">平铺</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreatePolicy}>创建</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleImportPolicies}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "导入中..." : "导入"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportPolicies}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "导出中..." : "导出"}
        </Button>
      </div>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索策略名称、描述或水印文本..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">已启用</SelectItem>
              <SelectItem value="inactive">已禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 批量操作栏 */}
      {selectedPolicies.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                已选择 {selectedPolicies.length} 个策略
              </span>
              <Button variant="outline" size="sm" onClick={() => handleBatchToggle(true)}>
                <Power className="h-4 w-4 mr-2" />
                批量启用
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchToggle(false)}>
                <PowerOff className="h-4 w-4 mr-2" />
                批量禁用
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                批量删除
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPolicies([])}>
              取消选择
            </Button>
          </div>
        </Card>
      )}

      {/* 策略列表头部 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedPolicies.length === filteredPolicies.length && filteredPolicies.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">全选</span>
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredPolicies.length} 个策略
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className={`p-4 ${selectedPolicies.includes(policy.id) ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedPolicies.includes(policy.id)}
                onCheckedChange={(checked) => handleSelectPolicy(policy.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{policy.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-gray-500">
                        <p>水印文本: {policy.watermarkText}</p>
                        <p>透明度: {(policy.opacity * 100).toFixed(0)}%</p>
                        <p>字体大小: {policy.fontSize}px</p>
                        <p>颜色: <span className="inline-block w-3 h-3 rounded-full ml-1" style={{backgroundColor: policy.color}}></span> {policy.color}</p>
                        <p>位置: {policy.position === 'center' ? '居中' : policy.position === 'diagonal' ? '对角线' : '角落'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? "启用" : "禁用"}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          创建于 {new Date(policy.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewPolicy(policy)}
                      title="预览策略"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(policy)}
                      title="编辑策略"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleCopyPolicy(policy)}
                      title="复制策略"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleToggleStatus(policy.id, policy.isActive)}
                      title={policy.isActive ? "禁用策略" : "启用策略"}
                    >
                      {policy.isActive ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeletePolicy(policy.id)}
                      title="删除策略"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {policies.length === 0 ? "暂无策略" : "未找到匹配的策略"}
          </h3>
          <p className="text-gray-600">
            {policies.length === 0 ? "创建第一个水印策略开始使用" : "尝试调整搜索条件或筛选器"}
          </p>
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={!!editingPolicy} onOpenChange={(open) => !open && setEditingPolicy(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑水印策略</DialogTitle>
          </DialogHeader>
                      <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">策略名称</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入策略名称"
                />
              </div>
              <div>
                <Label htmlFor="edit-watermarkText">水印文本</Label>
                <Input
                  id="edit-watermarkText"
                  value={formData.watermarkText}
                  onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                  placeholder="请输入水印文本"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">描述</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入策略描述"
                />
              </div>
              
              {/* 高级配置选项 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-opacity">透明度 ({(formData.opacity * 100).toFixed(0)}%)</Label>
                  <input
                    type="range"
                    id="edit-opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.opacity}
                    onChange={(e) => setFormData({ ...formData, opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fontSize">字体大小 ({formData.fontSize}px)</Label>
                  <input
                    type="range"
                    id="edit-fontSize"
                    min="12"
                    max="48"
                    step="2"
                    value={formData.fontSize}
                    onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-color">颜色</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="edit-color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-8 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-position">位置</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">居中</SelectItem>
                      <SelectItem value="diagonal">对角线</SelectItem>
                      <SelectItem value="corner">角落</SelectItem>
                      <SelectItem value="repeat">平铺</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="edit-isActive">启用策略</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleUpdatePolicy}>更新</Button>
                <Button variant="outline" onClick={() => setEditingPolicy(null)}>
                  取消
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* 策略预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>策略预览</DialogTitle>
          </DialogHeader>
          {previewPolicy && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">{previewPolicy.name}</h3>
                <p className="text-gray-600 mb-4">{previewPolicy.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">水印文本:</span>
                    <p className="mt-1">{previewPolicy.watermarkText}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">透明度:</span>
                    <p className="mt-1">{(previewPolicy.opacity * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">字体大小:</span>
                    <p className="mt-1">{previewPolicy.fontSize}px</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">颜色:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-4 h-4 rounded border" style={{backgroundColor: previewPolicy.color}}></div>
                      <span>{previewPolicy.color}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">位置:</span>
                    <p className="mt-1">
                      {previewPolicy.position === 'center' ? '居中' : 
                       previewPolicy.position === 'diagonal' ? '对角线' : 
                       previewPolicy.position === 'corner' ? '角落' : 
                       previewPolicy.position === 'repeat' ? '平铺' : previewPolicy.position}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">状态:</span>
                    <Badge variant={previewPolicy.isActive ? "default" : "secondary"} className="mt-1">
                      {previewPolicy.isActive ? "启用" : "禁用"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* 水印效果预览 */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative overflow-hidden">
                <div className="text-gray-400 mb-4">文档预览区域</div>
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: previewPolicy.opacity,
                    color: previewPolicy.color,
                    fontSize: `${previewPolicy.fontSize}px`,
                    transform: previewPolicy.position === 'diagonal' ? 'rotate(-45deg)' : 'none',
                    ...(previewPolicy.position === 'corner' && {
                      top: 'auto',
                      bottom: '10px',
                      right: '10px',
                      left: 'auto'
                    })
                  }}
                >
                  {previewPolicy.watermarkText}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => startEdit(previewPolicy)}>编辑</Button>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>关闭</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}