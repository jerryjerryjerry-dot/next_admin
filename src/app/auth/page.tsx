"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowRight, 
  Sparkles 
} from "lucide-react";

export default function AuthPage() {
  const [currentView, setCurrentView] = useState<"login" | "reset" | "newPassword">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stars, setStars] = useState<Array<{left: number, top: number, delay: number, duration: number}>>([]);

  const router = useRouter();

  // 在客户端生成星星位置，避免hydration错误
  useEffect(() => {
    const generateStars = () => {
      return Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3
      }));
    };
    setStars(generateStars());
  }, []);

  // tRPC mutations
  const loginMutation = api.auth.login.useMutation();
  const sendResetCodeMutation = api.auth.sendResetCode.useMutation();
  const resetPasswordMutation = api.auth.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (currentView === "login") {
        // 使用真实的 tRPC API 登录
        const result = await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });

        // 登录成功，存储用户信息
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", result.id);
        localStorage.setItem("userEmail", result.email ?? "");
        localStorage.setItem("userName", result.name ?? "");
        localStorage.setItem("userRole", result.role);
        router.push("/app-management");

      } else if (currentView === "reset") {
        // 使用真实的 API 发送验证码
        const result = await sendResetCodeMutation.mutateAsync({
          email: formData.email,
        });

        if (result.success) {
          // 开发环境下自动填入验证码
          if (result.debugCode) {
            setGeneratedCode(result.debugCode);
          }
          setCurrentView("newPassword");
          setError(""); // 清除错误
        }
      } else if (currentView === "newPassword") {
        // 前端验证
        if (formData.newPassword !== formData.confirmPassword) {
          setError("两次输入的密码不一致");
          return;
        }

        if (formData.newPassword.length < 6) {
          setError("密码至少需要6个字符");
          return;
        }

        // 调用真实的重置密码API
        const result = await resetPasswordMutation.mutateAsync({
          email: formData.email,
          code: formData.verificationCode,
          newPassword: formData.newPassword,
        });

        if (result.success) {
          setError("");
          alert("密码重置成功！请使用新密码登录");
          setCurrentView("login");
          setFormData({
            email: formData.email, // 保留邮箱
            password: "",
            newPassword: "",
            confirmPassword: "",
            verificationCode: "",
          });
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "操作失败，请重试";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "login":
        return "流量安全管理系统";
      case "reset":
        return "重置密码";
      case "newPassword":
        return "设置新密码";
      default:
        return "流量安全管理系统";
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case "login":
        return "守护网络安全，智能管理流量";
      case "reset":
        return "输入您的邮箱地址，我们将发送验证码";
      case "newPassword":
        return "请输入验证码和新密码";
      default:
        return "守护网络安全，智能管理流量";
    }
  };

  const getButtonText = () => {
    if (loading) return "处理中...";
    switch (currentView) {
      case "login":
        return "安全登录";
      case "reset":
        return "获取验证码";
      case "newPassword":
        return "重置密码";
      default:
        return "安全登录";
    }
  };

  return (
    <>
      <title>{getTitle()}</title>
      
      {/* 炫酷动画背景 */}
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black">
        {/* 动态粒子背景 */}
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`
              }}
            />
          ))}
        </div>
        
        {/* 熊猫主题几何形状 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-bounce" style={{animationDuration: '6s'}} />
          <div className="absolute top-40 right-32 w-20 h-20 bg-white rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}} />
          <div className="absolute bottom-32 left-32 w-24 h-24 bg-white rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '5s'}} />
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full animate-bounce" style={{animationDelay: '3s', animationDuration: '7s'}} />
        </div>
        
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* 主要内容区域 */}
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Logo和标题区域 */}
            <div className="text-center mb-8 space-y-6">
              {/* Logo图标 */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Shield className="w-10 h-10 text-gray-900" />
              </div>
              
              {/* 主标题 */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {getTitle()}
                </h1>
                <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {getSubtitle()}
                  <Sparkles className="w-4 h-4" />
                </p>
              </div>
            </div>

            {/* 登录表单卡片 */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 登录表单 */}
                  {currentView === "login" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">邮箱地址</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="请输入邮箱地址"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">密码</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="请输入密码"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 重置密码表单 */}
                  {currentView === "reset" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">邮箱地址</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="请输入您的邮箱地址"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* 新密码设置表单 */}
                  {currentView === "newPassword" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">验证码</label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder={generatedCode ? `验证码: ${generatedCode}` : "请输入验证码"}
                            value={formData.verificationCode}
                            onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">新密码</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="请输入新密码（至少6个字符）"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">确认密码</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="请确认新密码"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 错误提示 */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 提交按钮 */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white transition-all duration-300 transform hover:scale-105 shadow-lg group"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        处理中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getButtonText()}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>

                  {/* 页面切换 */}
                  <div className="text-center pt-4">
                    {currentView === "login" ? (
                      <button
                        type="button"
                        onClick={() => { setCurrentView("reset"); setError(""); }}
                        className="text-gray-400 hover:text-white text-sm transition-colors underline underline-offset-4"
                      >
                        忘记密码？
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentView("login");
                          setError("");
                          setFormData({ email: "", password: "", newPassword: "", confirmPassword: "", verificationCode: "" });
                        }}
                        className="text-gray-400 hover:text-white text-sm transition-colors underline underline-offset-4"
                      >
                        返回登录
                      </button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 测试账户信息 */}
            {currentView === "login" && (
              <Card className="mt-6 backdrop-blur-md bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    测试账户
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-blue-200">
                      <span>🔐 管理员:</span>
                      <span>admin@test.com / admin123</span>
                    </div>
                    <div className="flex justify-between text-blue-200">
                      <span>👤 普通用户:</span>
                      <span>user@test.com / user123</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 验证码提示 */}
            {currentView === "newPassword" && generatedCode && (
              <Card className="mt-6 backdrop-blur-md bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    开发环境提示
                  </h3>
                  <div className="text-xs text-green-200">
                    <p><strong>验证码:</strong> {generatedCode}</p>
                    <p className="mt-1 opacity-75">已自动填入或查看控制台</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
