/**
 * Password Validation Utilities
 *
 * Handles password strength validation, requirements checking,
 * and password confirmation matching
 */

import { AUTH_ERRORS } from './auth-constants'

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

export const PASSWORD_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < requirements.minLength) {
    errors.push(`At least ${requirements.minLength} characters`)
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('One uppercase letter (A-Z)')
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('One lowercase letter (a-z)')
  }

  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('One number (0-9)')
  }

  if (requirements.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push(`One special character (!@#$%^&*)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0

  if (password.length >= 8) score += 10
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 20

  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15

  return Math.min(100, score)
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score < 20) return 'Very Weak'
  if (score < 40) return 'Weak'
  if (score < 60) return 'Fair'
  if (score < 80) return 'Good'
  return 'Strong'
}

/**
 * Simple password validation wrapper (legacy compatibility)
 * Returns first error only instead of full errors array
 */
export function validatePasswordSimple(password: string): { valid: boolean; error?: string } {
  const result = validatePassword(password)
  return {
    valid: result.valid,
    error: result.errors.length > 0 ? result.errors[0] : undefined,
  }
}

/**
 * Validates password match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { valid: false, error: AUTH_ERRORS.PASSWORD_MISMATCH }
  }

  return { valid: true }
}
