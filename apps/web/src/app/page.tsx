'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/components/auth/AuthCard'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <AuthCard
        title="Welcome to ATAL AI"
        description="Choose your role to get started"
      >
        <div className="space-y-6">
          {/* Teacher Button */}
          <Button
            onClick={() => router.push('/teacher/start')}
            className="w-full h-16 text-lg shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5 transition-all"
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
            onClick={() => router.push('/student/start')}
            className="w-full h-16 text-lg border-2 hover:border-primary hover:shadow-[0_4px_12px_rgba(255,140,66,0.15)] hover:-translate-y-0.5 transition-all"
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

          {/* Info Box */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-primary p-4 rounded-lg">
            <p className="text-sm text-orange-900">
              <strong>📌 New here?</strong>
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
  )
}
