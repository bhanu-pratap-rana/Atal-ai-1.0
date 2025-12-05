/**
 * Phone Number Validation Utilities
 *
 * Handles phone number format validation (generic and India-specific),
 * sanitization, and masking for logging
 */

import { PHONE_COUNTRY_CODE, PHONE_DIGIT_LENGTH, AUTH_ERRORS } from './auth-constants'

/**
 * Validate phone number format (generic - international)
 * Accepts: +1234567890, 1234567890, (123) 456-7890
 */
export function validatePhoneNumber(phone: string): {
  valid: boolean
  error?: string
  normalized?: string
} {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length < 10) {
    return {
      valid: false,
      error: 'Phone number must be at least 10 digits',
    }
  }

  if (cleaned.length > 15) {
    return {
      valid: false,
      error: 'Phone number is too long',
    }
  }

  const normalized = '+' + cleaned.slice(-12)

  return {
    valid: true,
    normalized,
  }
}

/**
 * Sanitizes phone input - strips non-digits and enforces country code
 * India-specific implementation
 */
export function sanitizePhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '')
  const withoutCountryCode = digitsOnly.replace(/^91/, '')
  return `${PHONE_COUNTRY_CODE}${withoutCountryCode.slice(0, PHONE_DIGIT_LENGTH)}`
}

/**
 * Validates phone number format (India-specific)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE }
  }

  const sanitized = sanitizePhone(phone)

  if (sanitized.length !== PHONE_COUNTRY_CODE.length + PHONE_DIGIT_LENGTH) {
    return { valid: false, error: `Phone number must be ${PHONE_DIGIT_LENGTH} digits` }
  }

  if (!sanitized.startsWith(PHONE_COUNTRY_CODE)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE }
  }

  const digitsOnly = sanitized.slice(PHONE_COUNTRY_CODE.length)
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE }
  }

  return { valid: true }
}

/**
 * Mask phone number for logging
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `***${cleaned.slice(-4)}`
}
