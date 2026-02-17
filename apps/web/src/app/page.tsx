"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <AuthCard
        title="Welcome to ATAL AI"
        description="Choose your role to get started"
      >
        <div className="space-y-6">
          {/* Teacher Button */}
          <Button
            onClick={() => router.push("/teacher/start")}
            className="w-full h-14 text-lg shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5 transition-all"
            variant="default"
          >
            <span className="text-2xl mr-3">👨‍🏫</span>
            <div className="text-left">
              <div className="font-semibold">I&apos;m a Teacher</div>
              <div className="text-xs font-normal opacity-90">
                Register with school credentials
              </div>
            </div>
          </Button>

          {/* Student Button */}
          <Button
            onClick={() => router.push("/student/start")}
            className="w-full h-14 text-lg border-2 hover:border-primary hover:shadow-[var(--shadow-primary-sm)] hover:-translate-y-0.5 transition-all"
            variant="outline"
          >
            <span className="text-2xl mr-3">🎓</span>
            <div className="text-left">
              <div className="font-semibold">I&apos;m a Student</div>
              <div className="text-xs font-normal opacity-70">
                Sign in or create account
              </div>
            </div>
          </Button>

          {/* Info Box - Cyan themed */}
          <div className="bg-cyan-lightest border-l-4 border-cyan p-4 rounded-xl">
            <p className="text-sm text-cyan-darkest">
              <strong><span aria-hidden="true">💡</span> New here?</strong>
              <br />
              <span className="text-xs">
                Teachers need school verification. Students can join with email,
                phone, or as a guest.
              </span>
            </p>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
