'use client'

import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateEmail } from '@/lib/validation-utils'
import { requestOtp } from '@/app/actions/auth'
import { authLogger } from '@/lib/auth-logger'

/**
 * EmailOTPForm - Reusable email OTP send form
 * Handles email validation and OTP request
 * Reduces code duplication between student and teacher auth flows
 */
export interface EmailOTPFormProps {
  email: string
  onEmailChange: (email: string) => void
  onOtpSent: () => void
  isLoading: boolean
  error?: string
  onErrorChange: (error: string | null) => void
  submitButtonLabel?: string
  helperText?: string
}

export function EmailOTPForm({
  email,
  onEmailChange,
  onOtpSent,
  isLoading,
  error,
  onErrorChange,
  submitButtonLabel = 'Send OTP',
  helperText = 'Enter your email to receive an OTP',
}: EmailOTPFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onErrorChange(null)

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      onErrorChange(emailValidation.error || 'Invalid email')
      return
    }

    try {
      authLogger.debug('[EmailOTPForm] Requesting OTP for email')
      const result = await requestOtp(email.trim())

      if (!result.success) {
        onErrorChange(result.error || 'Failed to send OTP')
        toast.error(result.error || 'Failed to send OTP')
      } else {
        authLogger.success('[EmailOTPForm] OTP sent successfully')
        toast.success('OTP sent to your email!')
        onOtpSent()
      }
    } catch (err) {
      authLogger.error('[EmailOTPForm] Failed to send OTP', err)
      onErrorChange('Failed to send OTP')
      toast.error('Failed to send OTP')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-input">Email Address</Label>
        <Input
          id="email-input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          required
          aria-describedby={error ? 'email-error' : 'email-helper'}
        />
        {error ? (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <p id="email-helper" className="text-xs text-gray-600">
            {helperText}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? 'Sending...' : submitButtonLabel}
      </Button>
    </form>
  )
}
