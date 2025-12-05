/**
 * Combined Form Validation Utilities
 *
 * Higher-level validation for complete forms:
 * - Registration forms
 * - Sign-in forms (email and phone)
 * - Class joining forms
 */

import { validateEmail } from './email-validation'
import { validatePassword, validatePasswordMatch } from './password-validation'
import { validatePhone } from './phone-validation'
import { validateClassCode, validatePIN } from './code-validation'
import { validateName, validateRollNumber } from './name-validation'
import { AUTH_ERRORS } from './auth-constants'

export interface RegistrationFormData {
  email: string
  password: string
  name: string
}

export interface SignInFormData {
  email: string
  password: string
}

/**
 * Validate registration form
 */
export function validateRegistrationForm(data: RegistrationFormData): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email'
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors.join(', ')
  }

  const nameValidation = validateName(data.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error || 'Invalid name'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate sign in form
 */
export function validateSignInForm(data: SignInFormData): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email'
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Complete phone sign in validation
 */
export function validatePhoneSignInForm(phone: string, password: string): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const phoneValidation = validatePhone(phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error || AUTH_ERRORS.INVALID_PHONE
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Complete phone sign up validation
 */
export function validatePhoneSignUpForm(phone: string, password: string, confirmPassword: string): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const phoneValidation = validatePhone(phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error || AUTH_ERRORS.INVALID_PHONE
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors.join(', ')
  }

  const matchValidation = validatePasswordMatch(password, confirmPassword)
  if (!matchValidation.valid) {
    errors.confirmPassword = matchValidation.error || AUTH_ERRORS.PASSWORD_MISMATCH
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Complete join class validation
 */
export function validateJoinClassForm(classCode: string, rollNumber: string, pin: string): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const codeValidation = validateClassCode(classCode)
  if (!codeValidation.valid) {
    errors.classCode = codeValidation.error || AUTH_ERRORS.INVALID_CLASS_CODE
  }

  const rollValidation = validateRollNumber(rollNumber)
  if (!rollValidation.valid) {
    errors.rollNumber = rollValidation.error || AUTH_ERRORS.INVALID_ROLL_NUMBER
  }

  const pinValidation = validatePIN(pin)
  if (!pinValidation.valid) {
    errors.pin = pinValidation.error || AUTH_ERRORS.INVALID_PIN
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Utility function to format validation errors into readable message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n')
}
