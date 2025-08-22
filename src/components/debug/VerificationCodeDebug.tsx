"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";

interface VerificationCodeDebugProps {
  code?: string;
  email?: string;
  generatedAt?: string;
  expiresIn?: string;
  visible?: boolean;
}

export function VerificationCodeDebug({ 
  code, 
  email, 
  generatedAt, 
  expiresIn,
  visible = true 
}: VerificationCodeDebugProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const [copied, setCopied] = useState(false);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== "development" || !code) {
    return null;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-orange-800">
          🔧 开发模式 - 验证码调试信息
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="h-6 w-6 p-0"
          >
            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-700">验证码:</span>
              <code className="rounded bg-orange-100 px-2 py-1 font-mono text-orange-900">
                {code}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0"
                title="复制验证码"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copied && (
                <span className="text-xs text-green-600">已复制!</span>
              )}
            </div>
            
            {email && (
              <div>
                <span className="font-medium text-orange-700">邮箱:</span>
                <span className="ml-2 text-orange-800">{email}</span>
              </div>
            )}
            
            {generatedAt && (
              <div>
                <span className="font-medium text-orange-700">生成时间:</span>
                <span className="ml-2 text-orange-800">
                  {new Date(generatedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            )}
            
            {expiresIn && (
              <div>
                <span className="font-medium text-orange-700">有效期:</span>
                <span className="ml-2 text-orange-800">{expiresIn}</span>
              </div>
            )}
            
            <div className="mt-3 text-xs text-orange-600">
              💡 提示: 此调试信息仅在开发环境显示，生产环境会自动隐藏
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
