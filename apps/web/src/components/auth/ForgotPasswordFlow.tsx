'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailOTPForm } from '@/components/auth/EmailOTPForm'
import { OTPVerificationForm } from '@/components/auth/OTPVerificationForm'
import { PasswordValidationForm } from '@/components/auth/PasswordValidationForm'
import { sendForgotPasswordOtp, resetPasswordWithOtp } from '@/app/actions/auth'
import { authLogger } from '@/lib/auth-logger'

/**
 * ForgotPasswordFlow - Complete forgot password workflow
 * Handles:
 * 1. Email entry and OTP send
 * 2. OTP verification
 * 3. New password creation
 * Eliminates duplication across student and teacher auth flows
 */
export interface ForgotPasswordFlowProps {
  onSuccess: () => void
  onCancel: () => void
}

type ForgotPasswordStep = 'email' | 'otp' | 'password' | 'success'

export function ForgotPasswordFlow({ onSuccess, onCancel }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setErrorState] = useState<string | undefined>(undefined)

  // Wrapper to handle both null and undefined for error clearing
  const setError = (value: string | null | undefined) => {
    setErrorState(typeof value === 'string' ? value : undefined)
  }

  const handleEmailSubmit = async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      authLogger.debug('[ForgotPasswordFlow] Sending password reset OTP')
      const result = await sendForgotPasswordOtp(email.trim())

      if (!result.success) {
        setError(result.error || 'Failed to send OTP')
        toast.error(result.error || 'Failed to send OTP')
      } else {
        toast.success('OTP sent to your email!')
        setStep('otp')
      }
    } catch (err) {
      authLogger.error('[ForgotPasswordFlow] Failed to send OTP', err)
      setError('Failed to send OTP')
      toast.error('Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (verifyOtp: string) => {
    setIsLoading(true)
    setError(undefined)

    try {
      authLogger.debug('[ForgotPasswordFlow] Verifying password reset OTP')
      // OTP verification happens during password reset
      setOtp(verifyOtp)
      setStep('password')
    } catch (err) {
      authLogger.error('[ForgotPasswordFlow] OTP verification failed', err)
      setError('OTP verification failed')
      toast.error('OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      authLogger.debug('[ForgotPasswordFlow] Resetting password')
      const result = await resetPasswordWithOtp(email, otp, password)

      if (!result.success) {
        setError(result.error || 'Failed to reset password')
        toast.error(result.error || 'Failed to reset password')
      } else {
        authLogger.success('[ForgotPasswordFlow] Password reset successful')
        toast.success('Password reset successful!')
        setStep('success')
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (err) {
      authLogger.error('[ForgotPasswordFlow] Password reset failed', err)
      setError('Failed to reset password')
      toast.error('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email')
      setError(undefined)
    } else if (step === 'password') {
      setStep('otp')
      setError(undefined)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {step === 'email' && 'Enter your email to receive a password reset code'}
          {step === 'otp' && 'Enter the code sent to your email'}
          {step === 'password' && 'Create a new password'}
          {step === 'success' && 'Password reset successful!'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'email' && (
          <EmailOTPForm
            email={email}
            onEmailChange={setEmail}
            onOtpSent={handleEmailSubmit}
            isLoading={isLoading}
            error={error}
            onErrorChange={setError}
            submitButtonLabel="Send Reset Code"
            helperText="We'll send a code to reset your password"
          />
        )}

        {step === 'otp' && (
          <>
            <OTPVerificationForm
              otp={otp}
              onOtpChange={setOtp}
              isLoading={isLoading}
              error={error}
              onErrorChange={setError}
              onSubmit={handleOtpSubmit}
              submitButtonLabel="Verify Code"
              label="Reset Code"
              helperText="Enter the 6-digit code sent to your email"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="w-full"
              disabled={isLoading}
            >
              Back
            </Button>
          </>
        )}

        {step === 'password' && (
          <>
            <PasswordValidationForm
              password={password}
              onPasswordChange={setPassword}
              passwordConfirm={passwordConfirm}
              onPasswordConfirmChange={setPasswordConfirm}
              isLoading={isLoading}
              error={error}
              onErrorChange={setError}
              onSubmit={handlePasswordSubmit}
              submitButtonLabel="Reset Password"
              showValidation={true}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="w-full"
              disabled={isLoading}
            >
              Back
            </Button>
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xl">✓</span>
            </div>
            <p className="text-green-700 font-medium">Your password has been reset successfully!</p>
            <p className="text-sm text-gray-600">Redirecting to login...</p>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full"
          disabled={step === 'success' || isLoading}
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
