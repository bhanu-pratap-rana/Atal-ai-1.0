'use client'

import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { OTPInput } from '@/components/auth/OTPInput'
import { authLogger } from '@/lib/auth-logger'

/**
 * OTPVerificationForm - Reusable OTP verification form
 * Handles OTP input and verification logic
 * Reduces code duplication between different auth flows
 */
export interface OTPVerificationFormProps {
  otp: string
  onOtpChange: (otp: string) => void
  isLoading: boolean
  error?: string
  onErrorChange: (error: string | null) => void
  onSubmit: (otp: string) => Promise<void>
  submitButtonLabel?: string
  label?: string
  helperText?: string
}

export function OTPVerificationForm({
  otp,
  onOtpChange,
  isLoading,
  error,
  onErrorChange,
  onSubmit,
  submitButtonLabel = 'Verify OTP',
  label = 'OTP Code',
  helperText = 'Enter the 6-digit code sent to your email',
}: OTPVerificationFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onErrorChange(null)

    if (otp.length !== 6) {
      onErrorChange('OTP must be 6 digits')
      return
    }

    try {
      authLogger.debug('[OTPVerificationForm] Verifying OTP')
      await onSubmit(otp)
    } catch (err) {
      authLogger.error('[OTPVerificationForm] OTP verification failed', err)
      if (err instanceof Error) {
        onErrorChange(err.message || 'OTP verification failed')
        toast.error(err.message || 'OTP verification failed')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-input">{label}</Label>
        <OTPInput
          id="otp-input"
          value={otp}
          onChange={onOtpChange}
          disabled={isLoading}
          error={error}
          helperText={helperText}
          autoFocus
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || otp.length !== 6}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? 'Verifying...' : submitButtonLabel}
      </Button>
    </form>
  )
}
