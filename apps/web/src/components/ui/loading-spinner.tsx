"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  readonly message?: string;
  readonly size?: "sm" | "md" | "lg";
  readonly fullPage?: boolean;
  readonly className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 border-2",
  md: "w-10 h-10 border-3",
  lg: "w-14 h-14 border-4",
} as const;

export function LoadingSpinner({
  message,
  size = "md",
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "border-primary border-t-transparent rounded-full animate-spin",
          sizeClasses[size],
        )}
      />
      {message && (
        <p className="text-text-secondary text-sm animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        {spinner}
      </div>
    );
  }

  return spinner;
}
