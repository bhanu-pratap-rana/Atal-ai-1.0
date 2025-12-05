'use client'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, LogIn } from 'lucide-react'

/**
 * ATAL AI Teacher Choice Step - Jyoti Theme
 * 
 * Design Rules Applied:
 * - Primary button: gradient (Create Account)
 * - Outline button: primary border (Login)
 * - Info box: primary-light background with primary-dark text
 */

interface TeacherChoiceStepProps {
  loading: boolean
  onChoice: (choice: 'auth' | 'login') => void
}

export function TeacherChoiceStep({ loading, onChoice }: TeacherChoiceStepProps) {
  return (
    <AuthCard title="Welcome Back, Educators!" description="Select an option to get started">
      <div className="space-y-4">
        {/* Create Account Button - Primary Gradient */}
        <Button
          onClick={() => onChoice('auth')}
          disabled={loading}
          size="lg"
          variant="default"
          className="w-full h-12"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Create Account
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E4E0]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[#78716C]">OR</span>
          </div>
        </div>

        {/* Login Button - Outline Variant */}
        <Button
          onClick={() => onChoice('login')}
          disabled={loading}
          variant="outline"
          size="lg"
          className="w-full h-12"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Login to Existing Account
        </Button>

        {/* Info Box - Primary Light Background */}
        <div className="bg-primary-light border border-primary/20 rounded-[12px] p-4 mt-6">
          <p className="text-sm text-primary-dark">
            <span className="font-semibold">New teacher?</span> Create an account to access your dashboard and manage your classes.
          </p>
        </div>
      </div>
    </AuthCard>
  )
}
