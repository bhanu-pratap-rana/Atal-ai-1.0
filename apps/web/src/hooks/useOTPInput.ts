/**
 * Custom hook for managing OTP input state and validation
 * Consolidates OTP sanitization and validation logic
 */

import { useState } from 'react'
import { sanitizeOTP, validateOTP } from '@/lib/auth-validation'
import { OTP_LENGTH } from '@/lib/auth-constants'

export interface UseOTPInputReturn {
  value: string
  error: string | null
  onChange: (input: string) => void
  reset: () => void
  isValid: () => boolean
}

/**
 * Hook for managing OTP input
 * Automatically sanitizes input to 6 digits
 * @param initialValue - Initial OTP value (default: empty string)
 * @returns OTP state management object
 */
export function useOTPInput(initialValue: string = ''): UseOTPInputReturn {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (input: string) => {
    const sanitized = sanitizeOTP(input)
    setValue(sanitized)

    // Clear error when user starts typing correct length
    if (sanitized.length === OTP_LENGTH) {
      setError(null)
    }
  }

  const isValid = (): boolean => {
    const validation = validateOTP(value)
    if (!validation.valid) {
      setError(validation.error || 'Invalid OTP')
      return false
    }
    setError(null)
    return true
  }

  const reset = () => {
    setValue('')
    setError(null)
  }

  return {
    value,
    error,
    onChange: handleChange,
    reset,
    isValid,
  }
}
