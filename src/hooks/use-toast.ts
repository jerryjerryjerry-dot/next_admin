import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== toastId));
  }, []);

  const toast = useCallback(({ 
    title, 
    description, 
    variant = "default",
    duration = TOAST_REMOVE_DELAY 
  }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    };

    setToasts((toasts) => {
      const newToasts = [newToast, ...toasts].slice(0, TOAST_LIMIT);
      return newToasts;
    });

    // 自动移除toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const dismiss = useCallback((toastId: string) => {
    removeToast(toastId);
  }, [removeToast]);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toast,
    toasts,
    dismiss,
    dismissAll,
  };
}

