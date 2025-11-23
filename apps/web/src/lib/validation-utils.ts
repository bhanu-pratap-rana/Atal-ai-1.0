/**
 * Centralized Authentication & Validation Utilities
 *
 * Comprehensive validation functions for ATAL AI platform
 * Ensures consistency, maintainability, and DRY principles across all auth flows
 *
 * Consolidated from auth-validation.ts and validation-utils.ts (Rule 2: File Hygiene)
 *
 * Categories:
 * - Email validation (with typo detection and domain validation)
 * - Password validation (strength calculation & requirements)
 * - Code validation (school codes, class codes)
 * - PIN & OTP validation
 * - Phone number validation (India-specific + generic)
 * - Name & roll number validation
 * - Form-level validation (sign up, sign in, join class)
 */

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  OTP_LENGTH,
  PHONE_COUNTRY_CODE,
  PHONE_DIGIT_LENGTH,
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  PIN_LENGTH,
  CLASS_CODE_LENGTH,
  VALID_EMAIL_PROVIDERS,
  BLOCKED_EMAIL_DOMAINS,
  COMMON_DOMAIN_TYPOS,
  AUTH_ERRORS,
} from './auth-constants'

/**
 * Email Validation
 */
export const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr',
  'jp', 'cn', 'io', 'ai', 'tv', 'cc', 'ws', 'me',
  'co.uk', 'co.in',
]

/**
 * Calculates Levenshtein distance between two strings
 * Used for detecting email domain typos
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance (lower = more similar)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Detects if an email domain has a typo and suggests the correct domain
 * First checks exact matches in COMMON_DOMAIN_TYPOS, then uses Levenshtein distance
 * @param domain - Email domain to check
 * @returns Object with { hasTypo: boolean, suggestion?: string }
 */
export function detectDomainTypo(domain: string): { hasTypo: boolean; suggestion?: string } {
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return { hasTypo: true, suggestion: COMMON_DOMAIN_TYPOS[domain] }
  }

  const validDomains = VALID_EMAIL_PROVIDERS
  let closestMatch: { domain: string; distance: number } | null = null
  const threshold = 2

  for (const validDomain of validDomains) {
    const distance = levenshteinDistance(domain, validDomain)
    if (distance <= threshold) {
      if (!closestMatch || distance < closestMatch.distance) {
        closestMatch = { domain: validDomain, distance }
      }
    }
  }

  if (closestMatch) {
    return { hasTypo: true, suggestion: closestMatch.domain }
  }

  return { hasTypo: false }
}

/**
 * Validate email domain
 * @param domain - Email domain to validate
 * @returns boolean - True if domain is valid
 */
export function isValidEmailDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase()

  if (VALID_EMAIL_PROVIDERS.some(provider =>
    lowerDomain === provider || lowerDomain.endsWith('.' + provider)
  )) {
    return true
  }

  const domainParts = lowerDomain.split('.')
  if (domainParts.length < 2) return false

  if (domainParts.some(part => part.length === 0)) return false

  const tld = domainParts[domainParts.length - 1]
  if (!VALID_TLDS.includes(tld)) return false

  const domainName = domainParts[0]
  if (domainName.length < 2) return false

  return true
}

/**
 * Validates email format and provider legitimacy
 * Includes typo detection and domain validation
 * @param email - Email to validate
 * @returns Object with { valid: boolean, error?: string, suggestion?: string }
 */
export function validateEmail(email: string): { valid: boolean; error?: string; suggestion?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  const trimmedEmail = email.trim().toLowerCase()

  if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, error: AUTH_ERRORS.DISPOSABLE_EMAIL }
  }

  const isValidDomain = VALID_EMAIL_PROVIDERS.includes(domain)

  if (isValidDomain) {
    return { valid: true }
  }

  const typoDetection = detectDomainTypo(domain)
  if (typoDetection.hasTypo && typoDetection.suggestion) {
    const suggestedEmail = `${localPart}@${typoDetection.suggestion}`
    return {
      valid: false,
      error: `Email domain typo detected. Did you mean ${suggestedEmail}?`,
      suggestion: suggestedEmail,
    }
  }

  return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
}

/**
 * Normalize email (trim and lowercase)
 * @param email - Email to normalize
 * @returns Normalized email
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Mask email for logging
 * @param email - Email to mask
 * @returns Masked email (e.g., u***@example.com)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  return `${local[0]}***@${domain}`
}

/**
 * Password Validation
 */
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
 * @param password - Password to validate
 * @param requirements - Password requirements
 * @returns Object with validity and list of errors
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
 * @param password - Password to score
 * @returns Strength score
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
 * @param score - Strength score (0-100)
 * @returns Strength label
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
 * @param password - Password to validate
 * @returns Object with { valid: boolean, error?: string }
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
 * @param password - First password
 * @param confirmPassword - Confirmation password
 * @returns Object with { valid: boolean, error?: string }
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

/**
 * Code Validation (School Code, Class Code)
 */

/**
 * Validate school code format (6 alphanumeric uppercase)
 * @param code - Code to validate
 * @returns Object with validity and error message
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
 * Uses CLASS_CODE_LENGTH from auth-constants for dynamic validation
 * @param code - Class code to validate
 * @returns Object with validity and error message
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
 * Sanitizes class code - converts to uppercase
 * @param input - Raw class code input from user
 * @returns Sanitized class code (max CLASS_CODE_LENGTH characters, uppercase)
 */
export function sanitizeClassCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH)
}

/**
 * Validate PIN format (4 digits)
 * @param pin - PIN to validate
 * @returns Object with validity and error message
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
 * @param pin - PIN to validate
 * @returns Object with { valid: boolean, error?: string }
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
 * Sanitizes PIN input - strips non-digits
 * @param input - Raw PIN input from user
 * @returns Sanitized PIN (max PIN_LENGTH digits)
 */
export function sanitizePIN(input: string): string {
  return input.replace(/\D/g, '').slice(0, PIN_LENGTH)
}

/**
 * OTP Validation
 */

/**
 * Sanitizes OTP input to 6 digits only
 * @param input - Raw input from user
 * @returns Sanitized OTP string (max 6 digits)
 */
export function sanitizeOTP(input: string): string {
  return input.replace(/\D/g, '').slice(0, OTP_LENGTH)
}

/**
 * Validates OTP format
 * @param otp - OTP to validate
 * @returns Object with { valid: boolean, error?: string }
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

/**
 * Phone Number Validation
 */

/**
 * Validate phone number format (generic - international)
 * Accepts: +1234567890, 1234567890, (123) 456-7890
 * @param phone - Phone number to validate
 * @returns Object with validity, error message, and normalized format
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
 * @param input - Raw phone input from user
 * @returns Phone with country code (e.g., "+919876543210")
 */
export function sanitizePhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '')
  const withoutCountryCode = digitsOnly.replace(/^91/, '')
  return `${PHONE_COUNTRY_CODE}${withoutCountryCode.slice(0, PHONE_DIGIT_LENGTH)}`
}

/**
 * Validates phone number format (India-specific)
 * @param phone - Phone number to validate (with or without country code)
 * @returns Object with { valid: boolean, error?: string }
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
 * @param phone - Phone number to mask
 * @returns Masked phone (***7890)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `***${cleaned.slice(-4)}`
}

/**
 * Name Validation
 */

/**
 * Validate name format
 * @param name - Name to validate
 * @returns Object with validity and error message
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
 * @param rollNumber - Roll number to validate
 * @returns Object with validity and error message
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
 * Combined Form Validation
 */

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
 * @param data - Form data to validate
 * @returns Object with validity and field-specific errors
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
 * @param data - Form data to validate
 * @returns Object with validity and field-specific errors
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
 * @param phone - Phone to validate
 * @param password - Password to validate
 * @returns Object with { valid: boolean, errors: Record<string, string> }
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
 * @param phone - Phone to validate
 * @param password - Password to validate
 * @param confirmPassword - Confirmation password to validate
 * @returns Object with { valid: boolean, errors: Record<string, string> }
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
 * @param classCode - Class code to validate
 * @param rollNumber - Roll number to validate
 * @param pin - PIN to validate
 * @returns Object with { valid: boolean, errors: Record<string, string> }
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
 * Utility Functions
 */

/**
 * Sanitize string input (trim and remove extra spaces)
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/**
 * Check if two values are equal (case-insensitive for strings)
 * @param a - First value
 * @param b - Second value
 * @param caseInsensitive - Whether to compare case-insensitively
 * @returns boolean - True if equal
 */
export function isEqual(
  a: string | number | boolean,
  b: string | number | boolean,
  caseInsensitive = false
): boolean {
  if (typeof a !== typeof b) return false

  if (typeof a === 'string' && caseInsensitive) {
    return a.toLowerCase() === (b as string).toLowerCase()
  }

  return a === b
}

/**
 * Combine validation errors into a readable message
 * @param errors - Validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n')
}
