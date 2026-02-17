/**
 * TeacherForgotPasswordStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Handles password reset flow with OTP verification
 */

"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/validation-utils";
import type {
  TeacherOnboardingState,
  TeacherOnboardingActions,
} from "@/hooks/useTeacherOnboarding";

interface TeacherForgotPasswordStepProps {
  readonly state: TeacherOnboardingState;
  readonly actions: TeacherOnboardingActions;
}

export function TeacherForgotPasswordStep({
  state,
  actions,
}: TeacherForgotPasswordStepProps) {
  // Request OTP step
  if (!state.forgotOtpSent) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
        <AuthCard
          title="Reset Password"
          description="Enter your email to receive a recovery code"
        >
          <form
            onSubmit={actions.handleForgotPasswordOtp}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="teacher@school.edu"
                value={state.forgotEmail}
                onChange={(e) => actions.setForgotEmail(e.target.value)}
                required
                disabled={state.loading}
              />
              <p className="text-xs text-text-secondary">
                We&apos;ll send a recovery code to this email
              </p>
            </div>

            <Button
              type="submit"
              className="w-full shadow-[var(--shadow-primary)]"
              disabled={state.loading || !state.forgotEmail}
              loading={state.loading}
            >
              {state.loading ? "Sending..." : "Send Recovery Code"}
            </Button>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  actions.setStep("login");
                  actions.setForgotEmail("");
                  actions.setForgotOtpSent(false);
                }}
                className="text-sm text-primary hover:underline w-full text-center"
                disabled={state.loading}
              >
                Back to login
              </button>
            </div>
          </form>
        </AuthCard>
      </div>
    );
  }

  // Verify OTP and reset password step
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Reset Password"
        description={`Enter the code sent to ${state.forgotEmail}`}
      >
        <form onSubmit={actions.handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-otp">Recovery Code</Label>
            <Input
              id="forgot-otp"
              type="text"
              placeholder="123456"
              value={state.forgotOtp}
              onChange={(e) =>
                actions.setForgotOtp(
                  e.target.value.replaceAll(/\D/g, "").slice(0, 6),
                )
              }
              required
              disabled={state.loading}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-text-secondary">
              Enter the 6-digit code from your email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-new-password">New Password</Label>
            <Input
              id="forgot-new-password"
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={state.forgotNewPassword}
              onChange={(e) => actions.setForgotNewPassword(e.target.value)}
              required
              disabled={state.loading}
              minLength={8}
            />
            {/* Show validation errors for forgot password */}
            {state.forgotNewPassword.length > 0 &&
              (() => {
                const validation = validatePassword(state.forgotNewPassword);
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
            <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
            <Input
              id="forgot-confirm-password"
              type="password"
              placeholder="Re-enter password"
              value={state.forgotConfirmPassword}
              onChange={(e) =>
                actions.setForgotConfirmPassword(e.target.value)
              }
              required
              disabled={state.loading}
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-primary)]"
            disabled={
              state.loading ||
              state.forgotOtp.length !== 6 ||
              !validatePassword(state.forgotNewPassword).valid ||
              state.forgotNewPassword !== state.forgotConfirmPassword
            }
            loading={state.loading}
          >
            {state.loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={actions.handleForgotPasswordOtp}
              className="text-sm text-primary hover:text-primary-dark hover:underline w-full text-center"
              disabled={state.loading}
            >
              Resend Recovery Code
            </button>
            <button
              type="button"
              onClick={() => {
                actions.setForgotOtp("");
                actions.setForgotOtpSent(false);
              }}
              className="text-sm text-primary hover:underline w-full text-center"
              disabled={state.loading}
            >
              Back to email entry
            </button>
            <button
              type="button"
              onClick={() => {
                actions.setStep("login");
                actions.setForgotEmail("");
                actions.setForgotOtp("");
                actions.setForgotNewPassword("");
                actions.setForgotConfirmPassword("");
                actions.setForgotOtpSent(false);
              }}
              className="text-sm text-text-secondary hover:underline w-full text-center"
              disabled={state.loading}
            >
              Back to login
            </button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
