"use client";

import { useState } from "react";
import { 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  X,
  Shield
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { type PasswordFormData } from "~/types/user-management";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const changePasswordMutation = api.userManagement.changePassword.useMutation({
    onSuccess: () => {
      toast({
        title: "🔒 密码修改成功",
        description: "您的密码已更新，请妥善保管",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ 密码修改失败", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.currentPassword.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim()) {
      toast({
        title: "⚠️ 验证失败",
        description: "所有密码字段均为必填项",
        variant: "destructive",
      });
      return;
    }

    // 新密码长度验证
    if (formData.newPassword.length < 6) {
      toast({
        title: "⚠️ 密码太短",
        description: "新密码至少需要6个字符",
        variant: "destructive",
      });
      return;
    }

    // 确认密码验证
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "⚠️ 密码不匹配",
        description: "两次输入的新密码不一致",
        variant: "destructive",
      });
      return;
    }

    // 新旧密码不能相同
    if (formData.currentPassword === formData.newPassword) {
      toast({
        title: "⚠️ 密码重复",
        description: "新密码不能与当前密码相同",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });
  };

  const handleChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-bold text-black flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <Lock className="w-4 h-4 text-white" />
            </div>
            修改密码
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* 安全提示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-black mb-1">🔐 安全提醒</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>密码至少6个字符</li>
                  <li>建议包含大小写字母和数字</li>
                  <li>定期更换密码保障安全</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 当前密码 */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
              当前密码 *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleChange("currentPassword", e.target.value)}
                className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                placeholder="请输入当前密码"
                required
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              新密码 *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                placeholder="请输入新密码"
                required
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.newPassword && (
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

          {/* 确认新密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              确认新密码 *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={`pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black ${
                  formData.confirmPassword && formData.newPassword !== formData.confirmPassword 
                    ? 'border-red-300 focus:border-red-500' 
                    : ''
                }`}
                placeholder="请再次输入新密码"
                required
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-500">两次输入的密码不一致</p>
            )}
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
              disabled={changePasswordMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 border-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {changePasswordMutation.isPending ? "修改中..." : "确认修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
