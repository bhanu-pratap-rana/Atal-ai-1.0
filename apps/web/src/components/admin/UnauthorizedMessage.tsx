"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UnauthorizedMessageProps {
  readonly title?: string;
  readonly message?: string;
  readonly showLoginButton?: boolean;
  readonly onDismiss?: () => void;
}

/**
 * UnauthorizedMessage - Display access denied message with optional actions
 */
export function UnauthorizedMessage({
  title = "Access Denied",
  message = "You do not have permission to access this resource.",
  showLoginButton = true,
  onDismiss,
}: UnauthorizedMessageProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-error-light border border-error/30 rounded-lg p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error mb-2">{title}</h3>
            <p className="text-sm text-error/80 mb-4">{message}</p>

            <div className="flex gap-2">
              {showLoginButton && (
                <Button
                  onClick={() => router.push("/admin/login")}
                  variant="outline"
                  size="sm"
                  className="border-error/30 text-error hover:bg-error-light"
                >
                  Back to Login
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  size="sm"
                  className="border-error/30 text-error hover:bg-error-light"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
