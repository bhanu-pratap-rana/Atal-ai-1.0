/**
 * Name & Roll Number Validation Utilities
 *
 * Handles validation for:
 * - Teacher/student names
 * - Roll numbers
 * - General string sanitization
 */

import { AUTH_ERRORS } from './auth-constants'

/**
 * Validate name format
 */
export function validateName(name: string): {
  valid: boolean
  error?: string
} {
  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return {
      valid: false,
      error: 'Name must be at least 2 characters',
    }
  }

  if (trimmedName.length > 100) {
    return {
      valid: false,
      error: 'Name is too long',
    }
  }

  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    }
  }

  return { valid: true }
}

/**
 * Validate roll number format (alphanumeric)
 */
export function validateRollNumber(rollNumber: string): {
  valid: boolean
  error?: string
} {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_ROLL_NUMBER }
  }

  if (rollNumber.trim().length === 0) {
    return { valid: false, error: AUTH_ERRORS.INVALID_ROLL_NUMBER }
  }

  return { valid: true }
}

/**
 * Sanitize string input (trim and remove extra spaces)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}
