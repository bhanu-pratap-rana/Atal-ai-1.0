"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Sonner Toast Component - Jyoti Theme
 *
 * Uses CSS variables from globals.css for consistent theming.
 * Mobile-optimized with touch-friendly sizing and positioning.
 *
 * Toast Types:
 * - Default: Primary orange border
 * - Success: Green with checkmark
 * - Error: Red with warning
 * - Warning: Amber with alert
 * - Info: Cyan with info icon
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          // Base toast styling
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-text-primary group-[.toaster]:border-2 group-[.toaster]:border-primary/20 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:min-h-[3rem] group-[.toaster]:px-4 group-[.toaster]:py-3",
          // Toast title
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          // Toast description
          description:
            "group-[.toast]:text-text-secondary group-[.toast]:text-sm",
          // Action button (primary action)
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:min-h-[2.5rem] group-[.toast]:hover:bg-primary-dark group-[.toast]:transition-colors",
          // Cancel button (secondary action)
          cancelButton:
            "group-[.toast]:bg-surface group-[.toast]:text-text-secondary group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:min-h-[2.5rem] group-[.toast]:hover:bg-surface-dark group-[.toast]:transition-colors",
          // Close button
          closeButton:
            "group-[.toast]:bg-surface group-[.toast]:text-text-secondary group-[.toast]:hover:bg-surface-dark group-[.toast]:border-0",
          // Success toast
          success:
            "group-[.toaster]:border-success/30 group-[.toaster]:bg-success-light/50",
          // Error toast
          error:
            "group-[.toaster]:border-error/30 group-[.toaster]:bg-error-light/50",
          // Warning toast
          warning:
            "group-[.toaster]:border-warning/30 group-[.toaster]:bg-warning-light/50",
          // Info toast
          info: "group-[.toaster]:border-cyan/30 group-[.toaster]:bg-cyan-lightest/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
