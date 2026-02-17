"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation-utils";
import { OTP_LENGTH } from "@/lib/auth-constants";
import {
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from "@/app/actions/auth";
import { authLogger } from "@/lib/auth-logger";
import { toast } from "sonner";
import type { AuthState, AuthActions } from "@/hooks/useAuthState";
import type { UseOTPInputReturn } from "@/hooks/useOTPInput";

/**
 * ATAL AI Forgot Password Flow - Jyoti Theme
 *
 * Design Rules Applied:
 * - Primary button with correct shadows
 * - Error text: text-error
 * - Muted text: text-text-muted
 * - Links: text-text-secondary
 */

interface ForgotPasswordFlowProps {
  readonly state: AuthState;
  readonly actions: AuthActions;
  readonly otpInput: UseOTPInputReturn;
  readonly isLoading: boolean;
  readonly onSuccess: () => void;
}

export function ForgotPasswordFlow({
  state,
  actions,
  otpInput,
  isLoading,
  onSuccess,
}: ForgotPasswordFlowProps) {
  async function handleForgotPasswordOtp(e: React.FormEvent) {
    e.preventDefault();
    actions.setIsLoading(true);
    actions.setForgotPasswordError(null);

    // Validate email
    const emailValidation = validateEmail(state.forgotPasswordEmail);
    if (!emailValidation.valid) {
      actions.setForgotPasswordError(emailValidation.error || "Invalid email");
      actions.setIsLoading(false);
      return;
    }

    try {
      const result = await sendForgotPasswordOtp(
        state.forgotPasswordEmail.trim(),
      );
      if (result.success) {
        toast.success("Recovery code sent to your email!");
        actions.setForgotPasswordStep("reset");
      } else {
        actions.setForgotPasswordError(
          result.error || "Failed to send recovery code",
        );
        toast.error(result.error || "Failed to send recovery code");
      }
    } catch (error) {
      authLogger.error("[Forgot Password] Failed to send recovery code", error);
      actions.setForgotPasswordError("Failed to send recovery code");
      toast.error("Failed to send recovery code");
    } finally {
      actions.setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    // Validate password
    const passwordValidation = validatePassword(
      state.forgotPasswordNewPassword,
    );
    if (!passwordValidation.valid) {
      actions.setForgotPasswordError(
        passwordValidation.errors.join(", ") || "Invalid password",
      );
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
      return;
    }

    actions.setIsLoading(true);
    actions.setForgotPasswordError(null);

    try {
      const result = await resetPasswordWithOtp(
        state.forgotPasswordEmail,
        otpInput.value,
        state.forgotPasswordNewPassword,
      );

      if (result.success) {
        toast.success("Password reset successfully!");
        actions.resetForgotPassword();
        actions.setMainStep("signin");
        onSuccess();
      } else {
        actions.setForgotPasswordError(
          result.error || "Failed to reset password",
        );
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      authLogger.error("[Forgot Password] Failed to reset password", error);
      actions.setForgotPasswordError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      actions.setIsLoading(false);
    }
  }

  // Email input step
  if (state.forgotPasswordStep === "email") {
    return (
      <form onSubmit={handleForgotPasswordOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-text">
            Email Address
          </Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="your.email@example.com"
            value={state.forgotPasswordEmail}
            onChange={(e) => actions.setForgotPasswordEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full text-[17px]"
          disabled={isLoading || !state.forgotPasswordEmail}
          loading={isLoading}
        >
          <span>Send Recovery Code</span>
          <span className="ml-2">→</span>
        </Button>

        <button
          type="button"
          onClick={() => actions.setMainStep("signin")}
          className="text-sm text-text-secondary hover:text-primary hover:underline block w-full text-center transition-colors"
          disabled={isLoading}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  // Reset password step
  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-otp" className="text-text">
          Recovery Code
        </Label>
        <Input
          id="forgot-otp"
          type="text"
          placeholder="123456"
          value={otpInput.value}
          onChange={(e) => otpInput.onChange(e.target.value)}
          required
          disabled={isLoading}
          maxLength={OTP_LENGTH}
          className="text-center text-2xl font-mono tracking-widest"
        />
        <p className="text-xs text-text-muted">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-new-password" className="text-text">
          New Password
        </Label>
        <Input
          id="forgot-new-password"
          type="password"
          placeholder="Minimum 8 characters"
          value={state.forgotPasswordNewPassword}
          onChange={(e) => actions.setForgotPasswordNewPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-confirm-password" className="text-text">
          Confirm Password
        </Label>
        <Input
          id="forgot-confirm-password"
          type="password"
          placeholder="Re-enter your password"
          value={state.forgotPasswordNewPasswordConfirm}
          onChange={(e) =>
            actions.setForgotPasswordNewPasswordConfirm(e.target.value)
          }
          required
          disabled={isLoading}
        />
        {state.forgotPasswordError && (
          <p className="text-sm text-error">{state.forgotPasswordError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full text-[17px]"
        disabled={
          isLoading ||
          otpInput.value.length !== OTP_LENGTH ||
          !state.forgotPasswordNewPassword ||
          !state.forgotPasswordNewPasswordConfirm
        }
        loading={isLoading}
      >
        <span>Reset Password</span>
        <span className="ml-2">→</span>
      </Button>

      <button
        type="button"
        onClick={() => actions.setForgotPasswordStep("email")}
        className="text-sm text-text-secondary hover:text-primary hover:underline block w-full text-center transition-colors"
        disabled={isLoading}
      >
        Change email
      </button>
    </form>
  );
}
