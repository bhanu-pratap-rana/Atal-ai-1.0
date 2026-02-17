/**
 * TeacherChoiceStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Allows user to choose between creating a new account or logging in
 */

"use client";

import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import type { TeacherOnboardingActions } from "@/hooks/useTeacherOnboarding";

interface TeacherChoiceStepProps {
  readonly actions: TeacherOnboardingActions;
}

export function TeacherChoiceStep({ actions }: TeacherChoiceStepProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Teacher Portal"
        description="Are you a new or existing teacher?"
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Create Account Button */}
          <Button
            onClick={() => actions.setStep("auth")}
            className="w-full h-14 text-base shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5 transition-all"
            variant="default"
          >
            <span className="text-xl mr-3">✨</span>
            <div className="text-left">
              <div className="font-semibold">Create New Account</div>
              <div className="text-xs font-normal opacity-90">
                New teacher registration
              </div>
            </div>
          </Button>

          {/* Login Button */}
          <Button
            onClick={() => actions.setStep("login")}
            className="w-full h-14 text-base border-2 hover:border-primary hover:shadow-[var(--shadow-primary-sm)] hover:-translate-y-0.5 transition-all"
            variant="outline"
          >
            <span className="text-xl mr-3">🔓</span>
            <div className="text-left">
              <div className="font-semibold">Login to Account</div>
              <div className="text-xs font-normal opacity-70">
                Existing teacher login
              </div>
            </div>
          </Button>

          {/* Info Box - Cyan themed */}
          <div className="bg-cyan-lightest border-l-4 border-cyan p-4 rounded-xl">
            <p className="text-sm text-cyan-darkest">
              <strong>💡 Choose your option:</strong>
              <br />
              <span className="text-xs">
                New teachers need school verification. Existing teachers can
                login with email & password.
              </span>
            </p>
          </div>

          {/* Back Button */}
          <div className="text-center pt-2">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-text-secondary hover:text-primary hover:underline"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
