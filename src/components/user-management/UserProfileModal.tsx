"use client";

import { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  FileText,
  Save,
  X
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { type ProfileFormData } from "~/types/user-management";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    department?: string;
    position?: string;
    description?: string;
  };
}

export function UserProfileModal({ isOpen, onClose, userProfile }: UserProfileModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    email: userProfile.email,
    name: userProfile.name,
    phone: userProfile.phone || "",
    department: userProfile.department || "",
    position: userProfile.position || "",
    description: userProfile.description || "",
  });

  const updateProfileMutation = api.userManagement.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ 更新成功",
        description: "个人资料已更新",

      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ 更新失败", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.email.trim() || !formData.name.trim()) {
      toast({
        title: "⚠️ 验证失败",
        description: "邮箱和姓名为必填项",
        variant: "destructive",
      });
      return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "⚠️ 格式错误",
        description: "请输入有效的邮箱地址",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      id: userProfile.id,
      email: formData.email.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      department: formData.department.trim() || undefined,
      position: formData.position.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
  };

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-black scrollbar-hide max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-bold text-black flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-white" />
            </div>
            个人资料设置
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-white" />
              </div>
              基本信息
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  邮箱地址 *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  真实姓名 *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入真实姓名"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <Phone className="w-3 h-3 text-white" />
              </div>
              联系信息
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                手机号码
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                  placeholder="请输入手机号码"
                />
              </div>
            </div>
          </div>

          {/* 工作信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <Building className="w-3 h-3 text-white" />
              </div>
              工作信息
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  所属部门
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入所属部门"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                  职位
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入职位"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 个人简介 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <FileText className="w-3 h-3 text-white" />
              </div>
              个人简介
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                简介描述
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="border-gray-300 focus:border-black focus:ring-black resize-none"
                placeholder="请输入个人简介..."
                rows={4}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 border-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
