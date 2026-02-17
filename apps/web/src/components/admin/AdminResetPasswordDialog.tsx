"use client";

import { useState } from "react";
import { resetAdminPassword } from "@/app/actions/admin-management";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { FORM_TIMING } from "@/lib/constants/ui-timings";
import { clientLogger } from "@/lib/client-logger";

interface AdminResetPasswordDialogProps {
  readonly adminId: string;
  readonly adminEmail: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/**
 * AdminResetPasswordDialog - Modal for resetting admin password
 */
export function AdminResetPasswordDialog({
  adminId,
  adminEmail,
  isOpen,
  onClose,
  onSuccess,
}: AdminResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleResetPassword() {
    if (!newPassword) {
      setMessage({ type: "error", text: "Please enter a new password" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await resetAdminPassword(adminId, newPassword);

      if (result.success) {
        setMessage({ type: "success", text: "Password reset successfully" });
        toast.success("Password reset successfully");

        setTimeout(() => {
          setNewPassword("");
          setConfirmPassword("");
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        }, FORM_TIMING.successCallback);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to reset password",
        });
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      clientLogger.error(
        "[AdminResetPasswordDialog] Error resetting password",
        error instanceof Error ? error : { error: String(error) },
      );
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    if (!isLoading) {
      setNewPassword("");
      setConfirmPassword("");
      setMessage(null);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Reset Password</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-text-secondary hover:text-text disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-info-light border border-info/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-info-dark">
            <strong>Admin:</strong> {adminEmail}
          </p>
          <p className="text-xs text-info mt-2">
            The admin will need to use the new password on their next login.
          </p>
        </div>

        {/* New Password Input */}
        <div className="mb-4">
          <PasswordInput
            id="new-password"
            label="New Password (min. 8 characters)"
            placeholder="Enter new password"
            value={newPassword}
            onChange={setNewPassword}
            disabled={isLoading}
            showPassword={showPassword}
            onShowPasswordChange={setShowPassword}
            helpText="Enter a secure password with at least 8 characters"
          />
        </div>

        {/* Confirm Password Input */}
        <div className="mb-4">
          <PasswordInput
            id="confirm-password"
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={isLoading}
            showPassword={showPassword}
            onShowPasswordChange={setShowPassword}
          />
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`flex gap-3 p-3 rounded-lg border mb-4 ${
              message.type === "success"
                ? "bg-success-light border-success/30"
                : "bg-error-light border-error/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}
            >
              {message.text}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            disabled={isLoading || !newPassword || !confirmPassword}
            className="flex-1 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
