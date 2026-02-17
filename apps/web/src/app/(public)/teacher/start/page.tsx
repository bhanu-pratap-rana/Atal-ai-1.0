"use client";

import { useTeacherOnboarding } from "@/hooks/useTeacherOnboarding";
import { TeacherChoiceStep } from "@/components/auth/teacher/TeacherChoiceStep";
import { TeacherLoginStep } from "@/components/auth/teacher/TeacherLoginStep";
import { TeacherSignUpStep } from "@/components/auth/teacher/TeacherSignUpStep";
import { TeacherSetPasswordStep } from "@/components/auth/teacher/TeacherSetPasswordStep";
import { TeacherSchoolVerificationStep } from "@/components/auth/teacher/TeacherSchoolVerificationStep";
import { TeacherProfileStep } from "@/components/auth/teacher/TeacherProfileStep";
import { TeacherForgotPasswordStep } from "@/components/auth/teacher/TeacherForgotPasswordStep";
import { TeacherCompleteStep } from "@/components/auth/teacher/TeacherCompleteStep";

export default function TeacherStartPage() {
  const { state, actions } = useTeacherOnboarding();

  // Component router pattern - render based on current step
  if (state.step === "choice") {
    return <TeacherChoiceStep actions={actions} />;
  }

  if (state.step === "login") {
    return <TeacherLoginStep state={state} actions={actions} />;
  }

  if (state.step === "auth") {
    return <TeacherSignUpStep state={state} actions={actions} />;
  }

  if (state.step === "set-password") {
    return <TeacherSetPasswordStep state={state} actions={actions} />;
  }

  if (state.step === "verify-school") {
    return <TeacherSchoolVerificationStep state={state} actions={actions} />;
  }

  if (state.step === "profile") {
    return <TeacherProfileStep state={state} actions={actions} />;
  }

  if (state.step === "forgot-password") {
    return <TeacherForgotPasswordStep state={state} actions={actions} />;
  }

  if (state.step === "complete") {
    return <TeacherCompleteStep />;
  }

  return null;
}
