/**
 * Code/PIN/OTP Validation Utilities
 *
 * Handles validation and sanitization for:
 * - Class codes (6 alphanumeric)
 * - PINs (4 digits)
 * - OTPs (6 digits)
 * - School codes (6 alphanumeric)
 */

import { OTP_LENGTH, PIN_LENGTH, CLASS_CODE_LENGTH, AUTH_ERRORS } from './auth-constants'

/**
 * Validate school code format (6 alphanumeric uppercase)
 */
export function validateSchoolCode(code: string): {
  valid: boolean
  error?: string
} {
  const trimmedCode = code.toUpperCase()

  if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
    return {
      valid: false,
      error: 'School code must be 6 uppercase letters or numbers (e.g., SCHOOL1)',
    }
  }

  return { valid: true }
}

/**
 * Validate class code format (6 alphanumeric uppercase)
 */
export function validateClassCode(code: string): {
  valid: boolean
  error?: string
} {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_CLASS_CODE }
  }

  const sanitized = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH)

  if (sanitized.length !== CLASS_CODE_LENGTH) {
    return {
      valid: false,
      error: `Class code must be ${CLASS_CODE_LENGTH} characters`,
    }
  }

  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_CLASS_CODE }
  }

  return { valid: true }
}

/**
 * Sanitizes class code
 */
export function sanitizeClassCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH)
}

/**
 * Validate PIN format (4 digits)
 */
export function validatePin(pin: string): {
  valid: boolean
  error?: string
} {
  if (!/^\d{4}$/.test(pin)) {
    return {
      valid: false,
      error: 'PIN must be exactly 4 digits',
    }
  }

  return { valid: true }
}

/**
 * Validates PIN format with constants
 */
export function validatePIN(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_PIN }
  }

  if (pin.length !== PIN_LENGTH) {
    return { valid: false, error: `PIN must be exactly ${PIN_LENGTH} digits` }
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_PIN }
  }

  return { valid: true }
}

/**
 * Sanitizes PIN input
 */
export function sanitizePIN(input: string): string {
  return input.replace(/\D/g, '').slice(0, PIN_LENGTH)
}

/**
 * Sanitizes OTP input to 6 digits only
 */
export function sanitizeOTP(input: string): string {
  return input.replace(/\D/g, '').slice(0, OTP_LENGTH)
}

/**
 * Validates OTP format
 */
export function validateOTP(otp: string): { valid: boolean; error?: string } {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_OTP }
  }

  if (otp.length !== OTP_LENGTH) {
    return { valid: false, error: `OTP must be exactly ${OTP_LENGTH} digits` }
  }

  if (!/^\d+$/.test(otp)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_OTP }
  }

  return { valid: true }
}
