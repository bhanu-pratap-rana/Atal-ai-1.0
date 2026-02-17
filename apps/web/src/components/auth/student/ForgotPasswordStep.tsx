/**
 * ForgotPasswordStep Component
 * Extracted from StudentStartPage to reduce cognitive complexity
 * Handles password reset flow with OTP verification
 */

"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from "@/app/actions/auth";
import { useOTPInput } from "@/hooks/useOTPInput";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation-utils";
import {
  OTP_LENGTH,
} from "@/lib/auth-constants";
import { authLogger } from "@/lib/auth-logger";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseAuthStateReturn } from "@/hooks/useAuthState";

interface ForgotPasswordStepProps {
  readonly state: UseAuthStateReturn["state"];
  readonly actions: UseAuthStateReturn["actions"];
  readonly isLoading: boolean;
}

export function ForgotPasswordStep({
  state,
  actions,
  isLoading,
}: ForgotPasswordStepProps) {
  const forgotPasswordOtpInput = useOTPInput(state.forgotPasswordOtp);

  // ========================================
  // FORGOT PASSWORD - REQUEST OTP
  // ========================================
  const handleForgotPasswordOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setForgotPasswordError(null);

      const emailValidation = validateEmail(state.forgotPasswordEmail);
      if (!emailValidation.valid) {
        actions.setForgotPasswordError(
          emailValidation.error || "Invalid email",
        );
        actions.setIsLoading(false);
        return;
      }

      try {
        authLogger.debug(
          "[ForgotPassword] Sending OTP to email: " + state.forgotPasswordEmail,
        );
        const result = await sendForgotPasswordOtp(
          state.forgotPasswordEmail.trim(),
        );

        if (result.success) {
          toast.success("Reset code sent to your email!");
          actions.setForgotPasswordStep("reset");
        } else {
          authLogger.error("[ForgotPassword] Failed to send OTP", result);
          actions.setForgotPasswordError(
            result.error || "Failed to send reset code",
          );
          toast.error(result.error || "Failed to send reset code");
        }
      } catch (error) {
        authLogger.error("[ForgotPassword] Unexpected error", error);
        actions.setForgotPasswordError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [state.forgotPasswordEmail, actions],
  );

  // ========================================
  // FORGOT PASSWORD - RESET WITH OTP
  // ========================================
  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setForgotPasswordError(null);

      const passwordValidation = validatePassword(
        state.forgotPasswordNewPassword,
      );
      if (!passwordValidation.valid) {
        actions.setForgotPasswordError(
          passwordValidation.errors.join(", ") || "Invalid password",
        );
        actions.setIsLoading(false);
        return;
      }

      const matchValidation = validatePasswordMatch(
        state.forgotPasswordNewPassword,
        state.forgotPasswordNewPasswordConfirm,
      );
      if (!matchValidation.valid) {
        actions.setForgotPasswordError(
          matchValidation.error || "Passwords do not match",
        );
        actions.setIsLoading(false);
        return;
      }

      try {
        authLogger.debug("[ForgotPassword] Verifying OTP and resetting password");
        const result = await resetPasswordWithOtp(
          state.forgotPasswordEmail,
          forgotPasswordOtpInput.value,
          state.forgotPasswordNewPassword,
        );

        if (result.success) {
          authLogger.success("[ForgotPassword] Password reset successful");
          toast.success("Password reset successful! Redirecting to login...");
          actions.resetForgotPassword();
          setTimeout(() => {
            actions.setMainStep("signin");
            actions.setSigninTab("email");
            actions.setSigninEmailAddress(state.forgotPasswordEmail);
          }, 1500);
        } else {
          authLogger.error("[ForgotPassword] Reset failed", result);
          let errorMessage = result.error || "Failed to reset password";

          if (
            errorMessage.includes("expired") ||
            errorMessage.includes("invalid")
          ) {
            errorMessage =
              "Reset code has expired or is invalid. Please request a new one.";
          }

          actions.setForgotPasswordError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        authLogger.error("[ForgotPassword] Unexpected error", error);
        actions.setForgotPasswordError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [
      state.forgotPasswordEmail,
      state.forgotPasswordNewPassword,
      state.forgotPasswordNewPasswordConfirm,
      forgotPasswordOtpInput.value,
      actions,
    ],
  );

  if (state.forgotPasswordStep === "email") {
    return (
      <AuthCard
        title="Reset Password"
        description="Enter your email to receive a reset code"
      >
        <form onSubmit={handleForgotPasswordOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-password-email">Email Address</Label>
            <Input
              id="forgot-password-email"
              type="email"
              placeholder="your.email@example.com"
              value={state.forgotPasswordEmail}
              onChange={(e) =>
                actions.setForgotPasswordEmail(e.target.value)
              }
              required
              disabled={isLoading}
            />
          </div>

          {state.forgotPasswordError && (
            <p className="text-sm text-error">{state.forgotPasswordError}</p>
          )}

          <Button
            type="submit"
            className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
            disabled={isLoading || !state.forgotPasswordEmail}
          >
            {isLoading ? "Sending..." : "Send Reset Code"}
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => actions.setMainStep("signin")}
              className="text-primary hover:underline font-medium"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create New Password"
      description="Enter the code sent to your email"
    >
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-password-code">Reset Code</Label>
          <Input
            id="forgot-password-code"
            type="text"
            placeholder="123456"
            value={forgotPasswordOtpInput.value}
            onChange={(e) => forgotPasswordOtpInput.onChange(e.target.value)}
            required
            disabled={isLoading}
            maxLength={OTP_LENGTH}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            Enter the 6-digit code sent to {state.forgotPasswordEmail}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forgot-password-new">New Password</Label>
          <Input
            id="forgot-password-new"
            type="password"
            placeholder="Minimum 8 characters"
            value={state.forgotPasswordNewPassword}
            onChange={(e) =>
              actions.setForgotPasswordNewPassword(e.target.value)
            }
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {state.forgotPasswordNewPassword.length > 0 &&
            (() => {
              const validation = validatePassword(
                state.forgotPasswordNewPassword,
              );
              if (!validation.valid && validation.errors.length > 0) {
                return (
                  <p className="text-xs text-error">
                    {validation.errors.join(", ")}
                  </p>
                );
              }
              return null;
            })()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="forgot-password-confirm">Confirm Password</Label>
          <Input
            id="forgot-password-confirm"
            type="password"
            placeholder="Re-enter your new password"
            value={state.forgotPasswordNewPasswordConfirm}
            onChange={(e) =>
              actions.setForgotPasswordNewPasswordConfirm(e.target.value)
            }
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {state.forgotPasswordError && (
          <p className="text-sm text-error">{state.forgotPasswordError}</p>
        )}

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
          disabled={
            isLoading ||
            !forgotPasswordOtpInput.value ||
            !state.forgotPasswordNewPassword ||
            !state.forgotPasswordNewPasswordConfirm
          }
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>

        <button
          type="button"
          onClick={() => {
            actions.resetForgotPassword();
            actions.setMainStep("signin");
          }}
          className="text-sm text-text-secondary hover:underline block w-full text-center"
          disabled={isLoading}
        >
          Back to sign in
        </button>
      </form>
    </AuthCard>
  );
}
