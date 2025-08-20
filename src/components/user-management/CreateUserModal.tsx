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
  X,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { type CreateUserData } from "~/types/user-management";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CreateUserData>({
    username: "",
    email: "",
    name: "",
    password: "",
    role: "user",
    phone: "",
    department: "",
    position: "",
    description: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const createUserMutation = api.userManagement.createUser.useMutation({
    onSuccess: () => {
      toast({
        title: "🎉 创建成功",
        description: "用户账号已创建",
      });
      setFormData({
        username: "",
        email: "",
        name: "",
        password: "",
        role: "user",
        phone: "",
        department: "",
        position: "",
        description: "",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ 创建失败", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.username.trim() || !formData.email.trim() || !formData.name.trim() || !formData.password.trim()) {
      toast({
        title: "⚠️ 验证失败",
        description: "用户名、邮箱、姓名和密码为必填项",
        variant: "destructive",
      });
      return;
    }

    // 用户名验证
    if (formData.username.length < 3) {
      toast({
        title: "⚠️ 用户名太短",
        description: "用户名至少需要3个字符",
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

    // 密码长度验证
    if (formData.password.length < 6) {
      toast({
        title: "⚠️ 密码太短",
        description: "密码至少需要6个字符",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      username: formData.username.trim(),
      email: formData.email.trim(),
      name: formData.name.trim(),
      password: formData.password,
      role: formData.role,
      phone: formData.phone?.trim() || undefined,
      department: formData.department?.trim() || undefined,
      position: formData.position?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    });
  };

  const handleChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6) return { strength: 1, text: "弱", color: "text-red-500" };
    if (password.length < 10) return { strength: 2, text: "中等", color: "text-yellow-500" };
    if (password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, text: "强", color: "text-green-500" };
    }
    return { strength: 2, text: "中等", color: "text-yellow-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white border-black scrollbar-hide max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-bold text-black flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            创建新用户
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* 账号信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-white" />
              </div>
              账号信息
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  用户名 *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  初始密码 *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                    placeholder="请输入初始密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">密码强度:</span>
                    <span className={`font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all ${
                          passwordStrength.strength === 1 ? 'bg-red-500 w-1/3' :
                          passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/3' :
                          'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 权限设置 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-2">
                <Shield className="w-3 h-3 text-white" />
              </div>
              权限设置
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                用户角色 *
              </Label>
              <Select value={formData.role} onValueChange={(value: "admin" | "user") => handleChange("role", value)}>
                <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="请选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
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
                rows={3}
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
              disabled={createUserMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 border-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {createUserMutation.isPending ? "创建中..." : "创建用户"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
