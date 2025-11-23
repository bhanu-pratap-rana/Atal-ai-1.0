/**
 * usePasswordValidation - Custom hook for password input and validation
 *
 * Consolidates all password validation logic and state management
 * into a reusable hook, following the rule.md principle of NO DUPLICATION.
 *
 * Eliminates duplicate password validation code across signup and password reset flows.
 * Used by: email signup, phone signup, forgot password, teacher registration
 */

import { useState, useCallback } from 'react'
import { validatePassword, validatePasswordMatch } from '@/lib/validation-utils'

export interface PasswordValidationResult {
  passwordValid: boolean
  matchValid: boolean
  passwordError?: string
  matchError?: string
}

/**
 * usePasswordValidation Hook
 *
 * Manages password input state, validation, and error handling.
 * Provides unified interface for all password-based flows.
 *
 * WHY: Password validation is repeated 5+ times across the app:
 * - Email signup (2 password fields)
 * - Phone signup (2 password fields)
 * - Forgot password reset (2 password fields)
 * - Teacher registration (2 password fields)
 * - And more...
 *
 * Each implementation duplicated:
 * - State management for password + confirm password
 * - Validation logic (password strength check, match check)
 * - Error handling and display
 *
 * This hook consolidates all of that into a single, testable unit.
 *
 * @returns Object with password state, values, setters, and validation methods
 */
export function usePasswordValidation() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState<string>()
  const [matchError, setMatchError] = useState<string>()

  /**
   * Validate password strength
   * Returns validation result without setting state
   * Useful for checking before submission
   */
  const validatePasswordField = useCallback(
    (pwd: string = password): { valid: boolean; error?: string } => {
      if (!pwd) {
        return { valid: false, error: 'Password is required' }
      }
      return validatePassword(pwd)
    },
    [password]
  )

  /**
   * Validate that passwords match
   * Returns validation result without setting state
   * Useful for checking before submission
   */
  const validatePasswordFields = useCallback(
    (pwd: string = password, confirm: string = passwordConfirm): {
      valid: boolean
      error?: string
    } => {
      if (!pwd || !confirm) {
        return { valid: false, error: 'Both passwords are required' }
      }
      return validatePasswordMatch(pwd, confirm)
    },
    [password, passwordConfirm]
  )

  /**
   * Validate both password and confirmation in one call
   * Sets error state if validation fails
   * Useful for form submission validation
   *
   * @returns true if both password and confirm are valid, false otherwise
   */
  const validateAll = useCallback((): PasswordValidationResult => {
    const pwdValidation = validatePasswordField()
    const result: PasswordValidationResult = {
      passwordValid: pwdValidation.valid,
      passwordError: pwdValidation.error,
      matchValid: true,
      matchError: undefined,
    }

    if (pwdValidation.valid) {
      const matchValidation = validatePasswordFields()
      result.matchValid = matchValidation.valid
      result.matchError = matchValidation.error
    }

    // Set state for UI display
    setPasswordError(pwdValidation.error)
    if (!pwdValidation.valid) {
      setMatchError(undefined) // Clear match error if password is invalid
    } else {
      setMatchError(result.matchError)
    }

    return result
  }, [validatePasswordField, validatePasswordFields])

  /**
   * Clear all password fields and errors
   * Useful for successful submission or form reset
   */
  const reset = useCallback(() => {
    setPassword('')
    setPasswordConfirm('')
    setPasswordError(undefined)
    setMatchError(undefined)
  }, [])

  /**
   * Clear only error messages, keep password values
   * Useful for when user starts typing after seeing errors
   */
  const clearErrors = useCallback(() => {
    setPasswordError(undefined)
    setMatchError(undefined)
  }, [])

  return {
    // State
    password,
    passwordConfirm,
    passwordError,
    matchError,

    // Setters
    setPassword,
    setPasswordConfirm,
    setPasswordError,
    setMatchError,

    // Validation methods
    validatePasswordField,
    validatePasswordFields,
    validateAll,

    // Utils
    reset,
    clearErrors,

    // Computed
    isValid: password.length > 0 && passwordConfirm.length > 0 && passwordError === undefined && matchError === undefined,
  }
}
