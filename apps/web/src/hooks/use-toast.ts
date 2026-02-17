"use client";

/**
 * Toast hook wrapper for sonner
 *
 * Provides a consistent API for toast notifications
 */

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface UseToastReturn {
  toast: (options: ToastOptions) => void;
}

export function useToast(): UseToastReturn {
  const toast = ({ title, description, variant = "default", duration = 3000 }: ToastOptions) => {
    const message = title || description || "";
    const options = { description: title ? description : undefined, duration };

    switch (variant) {
      case "destructive":
        sonnerToast.error(message, options);
        break;
      case "success":
        sonnerToast.success(message, options);
        break;
      default:
        sonnerToast(message, options);
    }
  };

  return { toast };
}
