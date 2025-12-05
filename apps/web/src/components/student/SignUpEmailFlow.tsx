'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '@/lib/validation-utils'
import { OTP_LENGTH } from '@/lib/auth-constants'
import type { UseOTPInputReturn } from '@/hooks/useOTPInput'
import { requestOtp } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase-browser'
import { authLogger } from '@/lib/auth-logger'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { AuthState, AuthActions } from '@/hooks/useAuthState'

/**
 * ATAL AI Student Sign Up (Email) - Jyoti Theme
 * 
 * Design Rules Applied:
 * - Primary button with correct shadows
 * - Error text: #EF4444
 * - Links: #FF7E33
 * - Muted text: #78716C
 */

const RESEND_COOLDOWN_SECONDS = 60

interface SignUpEmailFlowProps {
  state: AuthState
  actions: AuthActions
  otpInput: UseOTPInputReturn
  isLoading: boolean
  onSuccess: () => void
}

export function SignUpEmailFlow({
  state,
  actions,
  otpInput,
  isLoading,
  onSuccess,
}: SignUpEmailFlowProps) {
  const router = useRouter()
  const supabase = createClient()
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Start cooldown timer when OTP is sent
  useEffect(() => {
    if (state.signupEmailOtpSent && resendCooldown === 0) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }, [state.signupEmailOtpSent])

  // Countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    try {
      const result = await requestOtp(state.signupEmailAddress.trim())
      if (result.success) {
        toast.success('OTP resent to your email!')
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      } else {
        toast.error(result.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }, [resendCooldown, isResending, state.signupEmailAddress])

  async function handleSignUpEmailSendOtp(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSignupEmailError(null)

    // Validate email
    const emailValidation = validateEmail(state.signupEmailAddress)
    if (!emailValidation.valid) {
      actions.setSignupEmailError(emailValidation.error || 'Invalid email')
      actions.setIsLoading(false)
      return
    }

    try {
      const result = await requestOtp(state.signupEmailAddress.trim())
      if (!result.success) {
        // Check if email already exists - redirect to login
        if (result.exists) {
          authLogger.debug('[SignUp Email] Email already exists, redirecting to login')
          toast.error(result.error || 'This email is already registered')
          // Switch to signin tab with email prefilled
          actions.setSigninEmailAddress(state.signupEmailAddress)
          actions.setMainStep('signin')
          actions.setSigninTab('email')
        } else {
          actions.setSignupEmailError(result.error || 'Failed to send OTP')
          toast.error(result.error || 'Failed to send OTP')
        }
      } else {
        toast.success('OTP sent to your email!')
        actions.setSignupEmailOtpSent(true)
      }
    } catch (error) {
      authLogger.error('[SignUp Email] Failed to send OTP', error)
      actions.setSignupEmailError('Failed to send OTP')
      toast.error('Failed to send OTP')
    } finally {
      actions.setIsLoading(false)
    }
  }

  async function handleSignUpEmailVerifyAndCreate(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSignupEmailError(null)

    // Validate inputs
    const passwordValidation = validatePassword(state.signupEmailPassword)
    if (!passwordValidation.valid) {
      actions.setSignupEmailError(passwordValidation.errors.join(', ') || 'Invalid password')
      actions.setIsLoading(false)
      return
    }

    const matchValidation = validatePasswordMatch(
      state.signupEmailPassword,
      state.signupEmailPasswordConfirm
    )
    if (!matchValidation.valid) {
      actions.setSignupEmailError(matchValidation.error || 'Passwords do not match')
      actions.setIsLoading(false)
      return
    }

    try {
      // Verify OTP and create account
      const { data, error } = await supabase.auth.verifyOtp({
        email: state.signupEmailAddress,
        token: otpInput.value,
        type: 'email',
      })

      if (error) {
        authLogger.error('[SignUp Email] Verification failed', error)
        actions.setSignupEmailError(error.message || 'Failed to verify OTP')
        toast.error(error.message || 'OTP verification failed')
        return
      }

      if (!data.user) {
        actions.setSignupEmailError('Verification failed')
        toast.error('Email verification failed')
        return
      }

      // Set password
      const { error: updateError } = await supabase.auth.updateUser({
        password: state.signupEmailPassword,
      })

      if (updateError) {
        authLogger.error('[SignUp Email] Failed to set password', updateError)
        actions.setSignupEmailError('Failed to set password')
        toast.error('Failed to set password')
        return
      }

      toast.success('Account created successfully! 🎉')
      actions.resetSignupEmail()
      onSuccess()
      router.push('/app/dashboard')
    } catch (error) {
      authLogger.error('[SignUp Email] Unexpected error', error)
      actions.setSignupEmailError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // Send OTP step
  if (!state.signupEmailOtpSent) {
    return (
      <form onSubmit={handleSignUpEmailSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-[#2D2A26]">Email Address</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="your.email@example.com"
            value={state.signupEmailAddress}
            onChange={(e) => actions.setSignupEmailAddress(e.target.value)}
            required
            disabled={isLoading}
          />
          {state.signupEmailError && (
            <p className="text-sm text-[#EF4444]">{state.signupEmailError}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full text-[17px]"
          disabled={isLoading || !state.signupEmailAddress}
          loading={isLoading}
        >
          Send OTP
          <span className="ml-2">→</span>
        </Button>
      </form>
    )
  }

  // Verify OTP & create account step
  return (
    <form onSubmit={handleSignUpEmailVerifyAndCreate} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email-otp" className="text-[#2D2A26]">Verification Code</Label>
        <Input
          id="signup-email-otp"
          type="text"
          placeholder="123456"
          value={otpInput.value}
          onChange={(e) => otpInput.onChange(e.target.value)}
          required
          disabled={isLoading}
          maxLength={OTP_LENGTH}
          className="text-center text-2xl font-mono tracking-widest"
        />
        <p className="text-xs text-[#78716C]">Enter the 6-digit code sent to your email</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email-password" className="text-[#2D2A26]">Password</Label>
        <Input
          id="signup-email-password"
          type="password"
          placeholder="Minimum 8 characters"
          value={state.signupEmailPassword}
          onChange={(e) => actions.setSignupEmailPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email-password-confirm" className="text-[#2D2A26]">Confirm Password</Label>
        <Input
          id="signup-email-password-confirm"
          type="password"
          placeholder="Re-enter your password"
          value={state.signupEmailPasswordConfirm}
          onChange={(e) => actions.setSignupEmailPasswordConfirm(e.target.value)}
          required
          disabled={isLoading}
        />
        {state.signupEmailError && (
          <p className="text-sm text-[#EF4444]">{state.signupEmailError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full text-[17px]"
        disabled={
          isLoading ||
          otpInput.value.length !== OTP_LENGTH ||
          !state.signupEmailPassword ||
          !state.signupEmailPasswordConfirm
        }
        loading={isLoading}
      >
        Create Account
        <span className="ml-2">→</span>
      </Button>

      {/* Resend OTP Button with Timer */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isLoading || isResending || resendCooldown > 0}
          className={`flex items-center gap-2 text-sm transition-colors ${
            resendCooldown > 0 || isResending
              ? 'text-text-muted cursor-not-allowed'
              : 'text-primary hover:text-primary-dark hover:underline'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
          {isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend OTP in ${formatTime(resendCooldown)}`
              : 'Resend OTP'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          actions.setSignupEmailOtpSent(false)
          otpInput.reset()
        }}
        className="text-sm text-text-secondary hover:text-primary hover:underline block w-full text-center transition-colors"
        disabled={isLoading}
      >
        Change email
      </button>
    </form>
  )
}
