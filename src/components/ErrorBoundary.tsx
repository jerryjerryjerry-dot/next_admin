import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 可以在这里添加错误日志上报
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              应用出现错误
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-700">
              <p className="mb-2">应用运行时遇到了一个错误，请尝试刷新页面或联系技术支持。</p>
              {this.state.error && (
                <details className="bg-gray-50 p-3 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium">错误详情</summary>
                  <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-gray-600 whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                刷新页面
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
