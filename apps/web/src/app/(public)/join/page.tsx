'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-browser'
import { usePhoneInput } from '@/hooks/usePhoneInput'
import { useOTPInput } from '@/hooks/useOTPInput'
import { OTP_LENGTH, PHONE_DIGIT_LENGTH } from '@/lib/auth-constants'
import {
  handleSendOTP as sendOTPHandler,
  handleVerifyOTP as verifyOTPHandler,
} from '@/lib/auth-handlers'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinClass } from '@/app/actions/student'

// ========================================
// STEP 1: AUTH SELECTION
// ========================================
function AuthSelectionStep({
  onPhoneAuth,
  onAnonymousAuth,
}: {
  onPhoneAuth: () => void
  onAnonymousAuth: () => void
}) {
  return (
    <AuthCard title="Join Class" description="Choose how you'd like to continue">
      <div className="space-y-4">
        <div className="bg-surface/50 p-4 rounded-lg border border-border">
          <p className="text-sm text-text-secondary mb-4">
            You need to sign in first to join a class. Choose one of the options below:
          </p>
        </div>

        <Button
          onClick={onPhoneAuth}
          className="w-full h-14 text-base text-[17px] shadow-[0_8px_20px_rgba(255,126,51,0.35)] hover:shadow-[0_12px_28px_rgba(255,126,51,0.45)] hover:-translate-y-0.5 transition-all"
          variant="default"
        >
          <span className="text-xl mr-2">📱</span>
          Continue with Phone (OTP)
        </Button>

        <Button
          onClick={onAnonymousAuth}
          className="w-full h-14 text-base text-[17px] border-2 hover:border-primary hover:shadow-[0_4px_12px_rgba(255,126,51,0.15)] hover:-translate-y-0.5 transition-all"
          variant="outline"
        >
          <span className="text-xl mr-2">👤</span>
          Continue as Guest
        </Button>

        <div className="bg-orange-50 border-l-4 border-primary p-3 rounded">
          <p className="text-xs text-orange-800">
            <strong>📌 Guest Access:</strong> You can join as a guest and upgrade your account later
            by adding a phone number or email.
          </p>
        </div>

        <div className="text-center pt-2">
          <a href="/student/start" className="text-sm text-primary hover:underline">
            Already have an account with email? Sign in here
          </a>
        </div>
      </div>
    </AuthCard>
  )
}

// ========================================
// STEP 2: PHONE OTP SIGN-IN
// ========================================
function PhoneOTPStep({
  onComplete,
  onBack,
  loading,
}: {
  onComplete: () => void
  onBack: () => void
  loading: boolean
}) {
  const supabase = createClient()
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [stepLoading, setStepLoading] = useState(false)
  const phoneInput = usePhoneInput()
  const otpInput = useOTPInput()

  async function handleSendOTPClick(e: React.FormEvent) {
    e.preventDefault()
    setStepLoading(true)

    try {
      const result = await sendOTPHandler(supabase, phoneInput.fullValue, 'phone')

      if (!result.success) {
        toast.error(result.error || 'Failed to send OTP')
      } else {
        toast.success('OTP sent to your phone!')
        setStep('verify')
      }
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setStepLoading(false)
    }
  }

  async function handleVerifyOTPClick(e: React.FormEvent) {
    e.preventDefault()
    setStepLoading(true)

    try {
      const result = await verifyOTPHandler(
        supabase,
        { phone: phoneInput.fullValue },
        otpInput.value,
        'sms'
      )

      if (!result.success) {
        toast.error(result.error || 'Failed to verify OTP')
      } else {
        toast.success('Phone verified! 🎉')
        onComplete()
      }
    } catch (error) {
      toast.error('Failed to verify OTP')
    } finally {
      setStepLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <AuthCard
        title="Verify OTP"
        description={`Enter the 6-digit code sent to ${phoneInput.fullValue}`}
      >
        <form onSubmit={handleVerifyOTPClick} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otpInput.value}
              onChange={(e) => otpInput.onChange(e.target.value)}
              required
              disabled={stepLoading || loading}
              maxLength={OTP_LENGTH}
              className="text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-text-secondary">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          <Button
            type="submit"
            className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,126,51,0.35)] hover:shadow-[0_12px_28px_rgba(255,126,51,0.45)] hover:-translate-y-0.5"
            disabled={stepLoading || loading || otpInput.value.length !== OTP_LENGTH}
            loading={stepLoading || loading}
          >
            Verify & Continue
            <span className="ml-2">→</span>
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-sm text-primary hover:underline block w-full"
              disabled={stepLoading || loading}
            >
              Change phone number
            </button>
            <br />
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-text-secondary hover:underline block w-full"
              disabled={stepLoading || loading}
            >
              Back to options
            </button>
          </div>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Phone Sign-in"
      description="Enter your phone number to receive an OTP"
    >
      <form onSubmit={handleSendOTPClick} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex items-center border border-input rounded-md">
            <span className="px-3 text-text-secondary font-medium bg-muted">+91</span>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              value={phoneInput.displayValue}
              onChange={(e) => phoneInput.onChange(e.target.value)}
              required
              disabled={stepLoading || loading}
              className="border-0 flex-1"
              maxLength={12}
            />
          </div>
          <p className="text-xs text-text-secondary">
            Enter your 10-digit phone number
          </p>
        </div>

        <div className="bg-orange-50 border-l-4 border-primary p-3 rounded">
          <p className="text-xs text-orange-800">
            <strong>📱 SMS Verification:</strong> You&apos;ll receive a 6-digit code via SMS.
            Standard rates may apply.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,126,51,0.35)] hover:shadow-[0_12px_28px_rgba(255,126,51,0.45)] hover:-translate-y-0.5"
          disabled={stepLoading || loading || phoneInput.displayValue.length < PHONE_DIGIT_LENGTH}
          loading={stepLoading || loading}
        >
          Send OTP
          <span className="ml-2">→</span>
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-text-secondary hover:underline block w-full"
            disabled={stepLoading || loading}
          >
            Back to options
          </button>
        </div>
      </form>
    </AuthCard>
  )
}

// ========================================
// STEP 3: JOIN CLASS FORM
// ========================================
function JoinClassForm({
  initialCode,
  initialPin,
}: {
  initialCode?: string
  initialPin?: string
}) {
  const router = useRouter()
  const [classCode, setClassCode] = useState(initialCode || '')
  const [rollNumber, setRollNumber] = useState('')
  const [pin, setPin] = useState(initialPin || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await joinClass({
        classCode: classCode.toUpperCase().trim(),
        rollNumber: rollNumber.trim(),
        pin: pin.trim(),
      })

      if (result.success) {
        toast.success('Successfully joined class! 🎉')
        router.push('/app/student/classes')
      } else {
        toast.error(result.error || 'Failed to join class')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Join Class"
      description="Enter the class code and PIN provided by your teacher"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="class-code">Class Code</Label>
          <Input
            id="class-code"
            type="text"
            placeholder="A3F7E2"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
            required
            disabled={loading}
            maxLength={6}
            className="uppercase font-mono text-center text-xl tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            6-character code provided by your teacher
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roll-number">Roll Number</Label>
          <Input
            id="roll-number"
            type="text"
            placeholder="e.g., 101, ST2024001"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
            disabled={loading}
          />
          <p className="text-xs text-text-secondary">
            Your student roll number or ID
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">Class PIN</Label>
          <Input
            id="pin"
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            disabled={loading}
            maxLength={4}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            4-digit PIN provided by your teacher
          </p>
        </div>

        <div className="bg-info-light border-l-4 border-info p-3 rounded">
          <p className="text-xs text-info-dark">
            <strong>📌 Note:</strong> Your teacher will verify your enrollment.
            Make sure to use the correct roll number.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,126,51,0.35)] hover:shadow-[0_12px_28px_rgba(255,126,51,0.45)] hover:-translate-y-0.5"
          disabled={loading || !classCode || !rollNumber || pin.length !== 4}
          loading={loading}
        >
          Join Class
          <span className="ml-2">→</span>
        </Button>
      </form>
    </AuthCard>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================
function JoinPageContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const codeFromUrl = searchParams.get('code')
  const pinFromUrl = searchParams.get('pin')
  const viaInvite = searchParams.get('via') === 'invite'

  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>(
    'loading'
  )
  const [authMethod, setAuthMethod] = useState<'selection' | 'phone' | 'complete'>('selection')
  const [loading, setLoading] = useState(false)

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setAuthState('authenticated')
        setAuthMethod('complete')
      } else {
        setAuthState('unauthenticated')

        // If not via invite link, redirect to student start page
        if (!viaInvite && !codeFromUrl) {
          router.push('/student/start')
        }
      }
    }

    checkAuth()
  }, [supabase, viaInvite, codeFromUrl])

  // Handle anonymous sign-in
  async function handleAnonymousAuth() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInAnonymously()

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Signed in as guest!')
        setAuthMethod('complete')
        setAuthState('authenticated')
      }
    } catch (error) {
      toast.error('Failed to sign in as guest')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (authState === 'loading') {
    return (
      <AuthCard title="Join Class" description="Loading...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthCard>
    )
  }

  // Already authenticated - show join form
  if (authState === 'authenticated' && authMethod === 'complete') {
    return (
      <JoinClassForm
        initialCode={codeFromUrl || undefined}
        initialPin={pinFromUrl || undefined}
      />
    )
  }

  // Not authenticated - show auth options
  if (authMethod === 'selection') {
    return (
      <AuthSelectionStep
        onPhoneAuth={() => setAuthMethod('phone')}
        onAnonymousAuth={handleAnonymousAuth}
      />
    )
  }

  // Phone OTP flow
  if (authMethod === 'phone') {
    return (
      <PhoneOTPStep
        onComplete={() => {
          setAuthMethod('complete')
          setAuthState('authenticated')
        }}
        onBack={() => setAuthMethod('selection')}
        loading={loading}
      />
    )
  }

  // Fallback
  return (
    <JoinClassForm
      initialCode={codeFromUrl || undefined}
      initialPin={pinFromUrl || undefined}
    />
  )
}

export default function JoinClassPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Join Class" description="Loading...">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AuthCard>
      }
    >
      <JoinPageContent />
    </Suspense>
  )
}
