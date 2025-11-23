'use client'

import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PhoneInputWithPrefix } from '@/components/auth/PhoneInputWithPrefix'
import { validatePhone } from '@/lib/validation-utils'
import { requestOtp } from '@/app/actions/auth'
import { authLogger } from '@/lib/auth-logger'

/**
 * PhoneOTPForm - Reusable phone OTP send form
 * Handles phone validation and OTP request via phone
 * Reduces code duplication between student and teacher auth flows
 */
export interface PhoneOTPFormProps {
  phone: string
  onPhoneChange: (phone: string) => void
  onOtpSent: () => void
  isLoading: boolean
  error?: string
  onErrorChange: (error: string | null) => void
  submitButtonLabel?: string
  helperText?: string
}

export function PhoneOTPForm({
  phone,
  onPhoneChange,
  onOtpSent,
  isLoading,
  error,
  onErrorChange,
  submitButtonLabel = 'Send OTP',
  helperText = 'Enter your phone number to receive an OTP',
}: PhoneOTPFormProps) {
  const fullPhone = `+91${phone}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onErrorChange(null)

    // Validate phone
    const phoneValidation = validatePhone(fullPhone)
    if (!phoneValidation.valid) {
      onErrorChange(phoneValidation.error || 'Invalid phone number')
      return
    }

    try {
      authLogger.debug('[PhoneOTPForm] Requesting OTP for phone')
      const result = await requestOtp(fullPhone)

      if (!result.success) {
        onErrorChange(result.error || 'Failed to send OTP')
        toast.error(result.error || 'Failed to send OTP')
      } else {
        authLogger.success('[PhoneOTPForm] OTP sent successfully')
        toast.success('OTP sent to your phone!')
        onOtpSent()
      }
    } catch (err) {
      authLogger.error('[PhoneOTPForm] Failed to send OTP', err)
      onErrorChange('Failed to send OTP')
      toast.error('Failed to send OTP')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhoneInputWithPrefix
        id="phone-input"
        label="Phone Number"
        value={phone}
        onChange={onPhoneChange}
        disabled={isLoading}
        error={error}
        helperText={helperText}
        required
      />

      <Button
        type="submit"
        disabled={isLoading || phone.length !== 10}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? 'Sending...' : submitButtonLabel}
      </Button>
    </form>
  )
}
