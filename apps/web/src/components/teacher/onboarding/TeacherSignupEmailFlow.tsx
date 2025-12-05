'use client'

import { FormEvent, useState, useEffect, useCallback, useRef } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 60 // 60 seconds cooldown

interface TeacherSignupEmailFlowProps {
  email: string
  emailError: string
  emailSuggestion: string
  otp: string
  otpSent: boolean
  loading: boolean
  onEmailChange: (value: string) => void
  onOtpChange: (value: string) => void
  onSendOtp: (e: FormEvent) => void
  onVerifyOtp: (e: FormEvent) => void
  onSuggestionAccept: (suggestion: string) => void
  onBack: () => void
}

export function TeacherSignupEmailFlow({
  email,
  emailError,
  emailSuggestion,
  otp,
  otpSent,
  loading,
  onEmailChange,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onSuggestionAccept,
  onBack,
}: TeacherSignupEmailFlowProps) {
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Start cooldown timer when OTP is sent - only on initial OTP send
  const otpSentRef = useRef(false)
  useEffect(() => {
    if (otpSent && !otpSentRef.current) {
      otpSentRef.current = true
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }, [otpSent])

  // Countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendOtp = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    await onSendOtp(e)
    setIsResending(false)
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
  }, [resendCooldown, isResending, onSendOtp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  if (!otpSent) {
    return (
      <AuthCard title="Sign Up with Email" description="Step 1 of 4: Verify your email">
        <form onSubmit={onSendOtp} className="space-y-4">
          {emailError && (
            <div className="bg-error-light border border-error/30 rounded-[12px] p-3">
              <p className="text-sm text-error font-semibold">{emailError}</p>

              {emailSuggestion && (
                <button
                  type="button"
                  onClick={() => onSuggestionAccept(emailSuggestion)}
                  className="text-sm text-error hover:underline mt-2 font-medium"
                >
                  Did you mean <span className="font-bold">{emailSuggestion}</span>?
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email Address</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
              required
            />
            <p className="text-xs text-gray-500">We'll send you a verification code</p>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim()}
            loading={loading}
            size="lg"
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </Button>

          <Button
            type="button"
            onClick={onBack}
            disabled={loading}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verify Your Email" description="Enter the verification code we sent">
      <form onSubmit={onVerifyOtp} className="space-y-4">
        <div className="bg-success-light border border-success/30 rounded-[12px] p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">Code Sent</p>
              <p className="text-xs text-green-700">Check your email for the 6-digit code</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-otp">Verification Code</Label>
          <Input
            id="email-otp"
            type="text"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            disabled={loading}
            maxLength={6}
            autoComplete="off"
            required
          />
          <p className="text-xs text-gray-500">From: {email}</p>
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          loading={loading}
          size="lg"
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>

        {/* Resend OTP Button with Timer */}
        <div className="flex items-center justify-center">
          <Button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || isResending || resendCooldown > 0}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark hover:bg-primary-light"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend OTP in ${formatTime(resendCooldown)}`
                : 'Resend OTP'}
          </Button>
        </div>

        <Button
          type="button"
          onClick={onBack}
          disabled={loading}
          variant="ghost"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email
        </Button>
      </form>
    </AuthCard>
  )
}
