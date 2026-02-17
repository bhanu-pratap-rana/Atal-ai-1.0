/**
 * ProfileStep Component
 * Extracted from StudentStartPage to reduce cognitive complexity
 * Handles student profile setup after account creation
 */

"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { saveStudentProfile } from "@/app/actions/student";
import {
  validateOptionalPhone,
  sanitizeProfilePhone,
} from "@/lib/validation-utils";
import { authLogger } from "@/lib/auth-logger";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseAuthStateReturn } from "@/hooks/useAuthState";

interface ProfileStepProps {
  readonly state: UseAuthStateReturn["state"];
  readonly actions: UseAuthStateReturn["actions"];
  readonly isLoading: boolean;
}

export function ProfileStep({
  state,
  actions,
  isLoading,
}: ProfileStepProps) {
  // ========================================
  // SAVE PROFILE
  // ========================================
  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setProfileError(null);

      // Validate phone if provided
      if (state.profilePhone) {
        const phoneValidation = validateOptionalPhone(state.profilePhone);
        if (!phoneValidation.valid) {
          actions.setProfileError(phoneValidation.error || "Invalid phone");
          actions.setIsLoading(false);
          return;
        }
      }

      try {
        authLogger.debug("[Profile] Saving student profile");
        const sanitizedPhone = state.profilePhone
          ? sanitizeProfilePhone(state.profilePhone)
          : undefined;

        const result = await saveStudentProfile({
          name: state.profileName,
          gender: state.profileGender as "male" | "female",
          phone: sanitizedPhone,
        });

        if (!result.success) {
          authLogger.error("[Profile] Failed to save profile", result);
          actions.setProfileError(result.error || "Failed to save profile");
          toast.error(result.error || "Failed to save profile");
          return;
        }

        authLogger.success("[Profile] Profile saved successfully");
        toast.success("Profile saved! Proceeding to next step...");
        actions.resetProfile();

        // Go to join class or dashboard based on preference
        setTimeout(() => {
          actions.setMainStep("join-class");
        }, 500);
      } catch (error) {
        authLogger.error("[Profile] Unexpected error", error);
        actions.setProfileError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [
      state.profileName,
      state.profileGender,
      state.profilePhone,
      actions,
    ],
  );

  return (
    <AuthCard
      title="Set Up Your Profile"
      description="Tell us a bit about yourself"
    >
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full Name *</Label>
          <Input
            id="profile-name"
            type="text"
            placeholder="John Doe"
            value={state.profileName}
            onChange={(e) => actions.setProfileName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-gender">Gender *</Label>
          <select
            id="profile-gender"
            value={state.profileGender}
            onChange={(e) => actions.setProfileGender(e.target.value as "male" | "female" | "")}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone Number (Optional)</Label>
          <Input
            id="profile-phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={state.profilePhone}
            onChange={(e) =>
              actions.setProfilePhone(e.target.value)
            }
            disabled={isLoading}
          />
        </div>

        {state.profileError && (
          <p className="text-sm text-error">{state.profileError}</p>
        )}

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
          disabled={
            isLoading || !state.profileName || !state.profileGender
          }
        >
          <span>Save Profile & Continue</span>
          <span className="ml-2">→</span>
        </Button>
      </form>
    </AuthCard>
  );
}
