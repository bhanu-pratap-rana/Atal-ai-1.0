/**
 * TeacherSetPasswordStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Handles password creation with strength indicator
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

interface TeacherSetPasswordStepProps {
  readonly state: TeacherOnboardingState;
  readonly actions: TeacherOnboardingActions;
}

export function TeacherSetPasswordStep({
  state,
  actions,
}: TeacherSetPasswordStepProps) {
  const getPasswordStrengthLabel = () => {
    if (state.password.length === 0) return "";
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[state.passwordStrength] || "";
  };

  const getPasswordStrengthColor = () => {
    const colors = [
      "bg-error",
      "bg-warning",
      "bg-warning",
      "bg-cyan",
      "bg-success",
    ];
    return colors[state.passwordStrength] || "bg-surface-dark";
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Create Password"
        description="Step 2 of 4: Secure your account"
      >
        <form
          onSubmit={actions.handleSetPassword}
          className="space-y-3 sm:space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password (min 8 characters)"
              value={state.password}
              onChange={(e) => actions.handlePasswordChange(e.target.value)}
              required
              disabled={state.loading}
              minLength={8}
            />
            {state.password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((strength) => (
                    <div
                      key={`strength-${strength}`}
                      className={`h-1 flex-1 rounded ${
                        strength <= state.passwordStrength
                          ? getPasswordStrengthColor()
                          : "bg-surface-dark"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-secondary">
                  Strength: {getPasswordStrengthLabel()}
                </p>
                {/* Show validation errors */}
                {(() => {
                  const validation = validatePassword(state.password);
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
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-confirm">Confirm Password</Label>
            <Input
              id="password-confirm"
              type="password"
              placeholder="Re-enter password"
              value={state.passwordConfirm}
              onChange={(e) => actions.setPasswordConfirm(e.target.value)}
              required
              disabled={state.loading}
              minLength={8}
            />
          </div>

          <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
            <p className="text-xs text-cyan-darkest">
              <strong>🔒 Why a password?</strong>
              <br />A password enables account recovery and allows you to
              access your account from multiple devices securely.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-primary)]"
            disabled={
              state.loading ||
              !validatePassword(state.password).valid ||
              state.password !== state.passwordConfirm
            }
            loading={state.loading}
          >
            Set Password & Continue
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
