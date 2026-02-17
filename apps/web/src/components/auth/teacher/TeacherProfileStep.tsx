/**
 * TeacherProfileStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Handles teacher profile information collection
 */

"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeProfilePhone } from "@/lib/validation-utils";
import type {
  TeacherOnboardingState,
  TeacherOnboardingActions,
} from "@/hooks/useTeacherOnboarding";

interface TeacherProfileStepProps {
  readonly state: TeacherOnboardingState;
  readonly actions: TeacherOnboardingActions;
}

export function TeacherProfileStep({
  state,
  actions,
}: TeacherProfileStepProps) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Teacher Profile"
        description="Step 4 of 4: Complete your profile"
      >
        <form onSubmit={actions.handleProfileSubmit} className="space-y-4">
          {/* Display verified school info */}
          {state.verifiedSchoolName && (
            <div className="bg-success-light border-l-4 border-success p-3 rounded">
              <p className="text-sm text-success">
                <strong>✓ School Verified</strong>
                <br />
                <span className="text-xs">
                  {state.verifiedSchoolName} ({state.schoolCode.toUpperCase()}
                  )
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={state.teacherName}
              onChange={(e) => actions.setTeacherName(e.target.value)}
              required
              disabled={state.loading}
            />
          </div>

          {/* Gender - Required */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-sm font-medium">Gender *</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teacher-gender"
                  value="male"
                  checked={state.teacherGender === "male"}
                  onChange={() => actions.setTeacherGender("male")}
                  disabled={state.loading}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teacher-gender"
                  value="female"
                  checked={state.teacherGender === "female"}
                  onChange={() => actions.setTeacherGender("female")}
                  disabled={state.loading}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">Female</span>
              </label>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={state.phone}
              onChange={(e) =>
                actions.setPhone(sanitizeProfilePhone(e.target.value))
              }
              disabled={state.loading}
              maxLength={10}
            />
            <p className="text-xs text-text-secondary">
              Enter 10-digit Indian mobile number (e.g., 9876543210)
            </p>
            {state.phone &&
              state.phone.length > 0 &&
              state.phone.length < 10 && (
                <p className="text-xs text-warning">
                  {10 - state.phone.length} more digits needed
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="village">Village/Location</Label>
            <Input
              id="village"
              type="text"
              placeholder="Enter your village or location"
              value={state.village}
              onChange={(e) => actions.setVillage(e.target.value)}
              disabled={state.loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-primary)]"
            disabled={
              state.loading || !state.teacherName || !state.teacherGender
            }
            loading={state.loading}
          >
            Complete Registration
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
