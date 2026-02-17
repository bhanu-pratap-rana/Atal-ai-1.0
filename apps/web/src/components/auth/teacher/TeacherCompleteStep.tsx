/**
 * TeacherCompleteStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Displays completion message and redirects to dashboard
 */

"use client";

import { AuthCard } from "@/components/auth/AuthCard";

export function TeacherCompleteStep() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Registration Complete!"
        description="Welcome to ATAL AI"
      >
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <p className="text-lg font-semibold">You&apos;re all set!</p>
          <p className="text-sm text-text-secondary">
            Redirecting to your teacher dashboard...
          </p>
        </div>
      </AuthCard>
    </div>
  );
}
