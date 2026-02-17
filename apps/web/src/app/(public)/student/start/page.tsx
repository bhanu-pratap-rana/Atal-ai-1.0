"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useAuthState } from "@/hooks/useAuthState";
import { ChoiceStep } from "@/components/auth/StudentStepComponents";
import { SignInStep } from "@/components/auth/student/SignInStep";
import { SignUpStep } from "@/components/auth/student/SignUpStep";
import { ForgotPasswordStep } from "@/components/auth/student/ForgotPasswordStep";
import { ProfileStep } from "@/components/auth/student/ProfileStep";
import { JoinClassStep } from "@/components/auth/student/JoinClassStep";

export default function StudentStartPage() {
  const router = useRouter();
  const supabase = createClient();
  const { state, actions } = useAuthState();

  // Check if already authenticated (only redirect if on initial choice step)
  // Don't redirect if user is completing profile or joining class after signup
  useEffect(() => {
    async function checkAuth() {
      // Only redirect from initial choice step
      // Users completing profile/join-class need to stay on this page
      if (state.mainStep !== "choice") {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/app/dashboard");
      }
    }
    checkAuth();
  }, [supabase, router, state.mainStep]);

  // ========================================
  // RENDER: Component Router
  // Step-based rendering to reduce cognitive complexity
  // ========================================

  // CHOICE STEP: Let user choose between signing in or creating account
  if (state.mainStep === "choice") {
    return (
      <ChoiceStep loading={state.isLoading} actions={actions} state={state} />
    );
  }

  // SIGN IN STEP: Email, Phone, or Username authentication
  if (state.mainStep === "signin") {
    return (
      <SignInStep
        state={state}
        actions={actions}
        isLoading={state.isLoading}
      />
    );
  }

  // SIGN UP STEP: Email, Phone, or Username registration
  if (state.mainStep === "signup") {
    return (
      <SignUpStep
        state={state}
        actions={actions}
        isLoading={state.isLoading}
      />
    );
  }

  // FORGOT PASSWORD STEP: Password reset flow
  if (state.mainStep === "forgot-password") {
    return (
      <ForgotPasswordStep
        state={state}
        actions={actions}
        isLoading={state.isLoading}
      />
    );
  }

  // PROFILE STEP: Setup student profile after account creation
  if (state.mainStep === "profile") {
    return (
      <ProfileStep
        state={state}
        actions={actions}
        isLoading={state.isLoading}
      />
    );
  }

  // JOIN CLASS STEP: Enroll in a class
  if (state.mainStep === "join-class") {
    return (
      <JoinClassStep
        state={state}
        actions={actions}
        isLoading={state.isLoading}
      />
    );
  }

  // Fallback (should not reach here)
  return null;
}
