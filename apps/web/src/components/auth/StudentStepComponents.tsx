/**
 * Student Start Page Step Components
 * Extracted to reduce cognitive complexity of StudentStartPage
 */

"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import type { UseAuthStateReturn } from "@/hooks/useAuthState";

interface StepComponentProps {
  readonly loading: boolean;
  readonly actions: UseAuthStateReturn["actions"];
  readonly state: UseAuthStateReturn["state"];
}

export function ChoiceStep({ actions, loading: _loading, state: _state }: StepComponentProps) {
  return (
    <AuthCard
      title="Welcome, Student!"
      description="Choose an option to continue"
    >
      <div className="space-y-4">
        <Button
          onClick={() => actions.setMainStep("signup")}
          className="w-full h-14 text-base text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5 transition-all"
          variant="default"
        >
          <span className="text-xl mr-2">✨</span>
          <span>Create Account</span>
        </Button>

        <Button
          onClick={() => actions.setMainStep("signin")}
          className="w-full h-14 text-base text-[17px] border-2 hover:border-primary hover:shadow-[var(--shadow-primary-sm)] hover:-translate-y-0.5 transition-all"
          variant="outline"
        >
          <span className="text-xl mr-2">🔑</span>
          <span>Login</span>
        </Button>

        <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
          <p className="text-xs text-cyan-darkest">
            <strong>💡 New Student?</strong> Create an account to join classes
            and track your learning progress.
          </p>
        </div>

        <div className="text-center pt-2">
          <a
            href="/teacher/start"
            className="text-sm text-primary hover:underline"
          >
            Are you a teacher? Login here
          </a>
        </div>
      </div>
    </AuthCard>
  );
}
