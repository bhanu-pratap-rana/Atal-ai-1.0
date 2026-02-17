/**
 * TeacherSchoolVerificationStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Handles school code and staff PIN verification
 */

"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  TeacherOnboardingState,
  TeacherOnboardingActions,
} from "@/hooks/useTeacherOnboarding";

interface TeacherSchoolVerificationStepProps {
  readonly state: TeacherOnboardingState;
  readonly actions: TeacherOnboardingActions;
}

export function TeacherSchoolVerificationStep({
  state,
  actions,
}: TeacherSchoolVerificationStepProps) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="School Verification"
        description="Step 3 of 4: Verify your school credentials"
      >
        <form
          onSubmit={actions.handleSchoolVerification}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="school-code">School Code</Label>
            <Input
              id="school-code"
              type="text"
              placeholder="14H0182"
              value={state.schoolCode}
              onChange={(e) =>
                actions.setSchoolCode(e.target.value.toUpperCase())
              }
              required
              disabled={state.loading}
              maxLength={10}
              className="uppercase font-mono"
            />
            <p className="text-xs text-text-secondary">
              SEBA school code (e.g., 14H0182)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-pin">Staff PIN</Label>
            <Input
              id="staff-pin"
              type="password"
              placeholder="Enter staff PIN"
              value={state.staffPin}
              onChange={(e) => actions.setStaffPin(e.target.value)}
              required
              disabled={state.loading}
              className="font-mono"
            />
            <p className="text-xs text-text-secondary">
              Provided by your school administrator
            </p>
          </div>

          <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
            <p className="text-xs text-cyan-darkest">
              <strong>🔒 Secure Verification</strong>
              <br />
              Your credentials are verified using bcrypt encryption. Staff
              PINs are never exposed to clients.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-primary)]"
            disabled={state.loading}
            loading={state.loading}
          >
            Verify School
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
