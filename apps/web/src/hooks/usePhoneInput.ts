/**
 * Custom hook for managing phone input state and validation
 * Consolidates phone number formatting and validation logic
 */

import { useState } from 'react'
import { sanitizePhone, validatePhone } from '@/lib/auth-validation'
import { PHONE_COUNTRY_CODE, PHONE_DIGIT_LENGTH } from '@/lib/auth-constants'

export interface UsePhoneInputReturn {
  displayValue: string // Phone without country code for display
  fullValue: string // Phone with country code for submission
  error: string | null
  onChange: (input: string) => void
  reset: () => void
  isValid: () => boolean
}

/**
 * Hook for managing phone number input
 * Automatically formats with +91 country code (India-specific)
 * Users only see/type 10-digit number
 * @param initialValue - Initial phone value (default: empty string)
 * @returns Phone state management object
 */
export function usePhoneInput(initialValue: string = ''): UsePhoneInputReturn {
  const [fullValue, setFullValue] = useState(initialValue ? sanitizePhone(initialValue) : '')
  const [error, setError] = useState<string | null>(null)

  const displayValue = fullValue.replace(/^[\+\d]+/, (match) => {
    // Remove country code for display
    return match.replace(PHONE_COUNTRY_CODE, '')
  })

  const handleChange = (input: string) => {
    // User types just digits, we sanitize and prepend country code
    const digitsOnly = input.replace(/\D/g, '').slice(0, PHONE_DIGIT_LENGTH)

    // Only update if valid digit length or empty
    if (digitsOnly.length <= PHONE_DIGIT_LENGTH) {
      const fullPhoneNumber = digitsOnly.length > 0 ? `${PHONE_COUNTRY_CODE}${digitsOnly}` : ''
      setFullValue(fullPhoneNumber)

      // Clear error when user reaches correct length
      if (digitsOnly.length === PHONE_DIGIT_LENGTH) {
        setError(null)
      }
    }
  }

  const isValid = (): boolean => {
    const validation = validatePhone(fullValue)
    if (!validation.valid) {
      setError(validation.error || 'Invalid phone number')
      return false
    }
    setError(null)
    return true
  }

  const reset = () => {
    setFullValue('')
    setError(null)
  }

  return {
    displayValue,
    fullValue,
    error,
    onChange: handleChange,
    reset,
    isValid,
  }
}
