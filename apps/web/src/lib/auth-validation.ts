/**
 * Centralized authentication validation utilities
 * Reusable validators for email, password, OTP, phone, etc.
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
  // Check exact matches first (fast path)
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return { hasTypo: true, suggestion: COMMON_DOMAIN_TYPOS[domain] }
  }

  // Use Levenshtein distance for fuzzy matching
  const validDomains = VALID_EMAIL_PROVIDERS
  let closestMatch: { domain: string; distance: number } | null = null
  const threshold = 2 // Max distance to suggest a typo

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
 * Validates email format and provider legitimacy
 * @param email - Email to validate
 * @returns Object with { valid: boolean, error?: string, suggestion?: string }
 */
export function validateEmail(email: string): { valid: boolean; error?: string; suggestion?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  const trimmedEmail = email.trim().toLowerCase()

  // Check length
  if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  // Email format validation - use strict regex for proper email format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  // Extract domain
  const [localPart, domain] = trimmedEmail.split('@')

  // Check against blocked domains (disposable emails)
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, error: AUTH_ERRORS.DISPOSABLE_EMAIL }
  }

  // Check if domain is in valid providers list
  const isValidDomain = VALID_EMAIL_PROVIDERS.includes(domain)

  if (isValidDomain) {
    // Domain is valid, return success immediately without typo checking
    return { valid: true }
  }

  // Domain is NOT in valid providers list - check for typos
  const typoDetection = detectDomainTypo(domain)
  if (typoDetection.hasTypo && typoDetection.suggestion) {
    const suggestedEmail = `${localPart}@${typoDetection.suggestion}`
    return {
      valid: false,
      error: `Email domain typo detected. Did you mean ${suggestedEmail}?`,
      suggestion: suggestedEmail,
    }
  }

  // Domain is not in valid providers and no typo suggestion found
  // Return invalid - unknown domain
  return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with { valid: boolean, error?: string }
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_PASSWORD }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` }
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters` }
  }

  return { valid: true }
}

/**
 * Validates that two passwords match
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
 * Sanitizes phone input - strips non-digits and enforces country code
 * @param input - Raw phone input from user
 * @returns Phone with country code (e.g., "+919876543210")
 */
export function sanitizePhone(input: string): string {
  // Remove all non-digits
  const digitsOnly = input.replace(/\D/g, '')

  // Remove existing country code if present (91)
  const withoutCountryCode = digitsOnly.replace(/^91/, '')

  // Return with country code prefix
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
 * Sanitizes PIN input - strips non-digits
 * @param input - Raw PIN input from user
 * @returns Sanitized PIN (max 4 digits)
 */
export function sanitizePIN(input: string): string {
  return input.replace(/\D/g, '').slice(0, PIN_LENGTH)
}

/**
 * Validates PIN format
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
 * Sanitizes class code - converts to uppercase
 * @param input - Raw class code input from user
 * @returns Sanitized class code (max 6 characters, uppercase)
 */
export function sanitizeClassCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH)
}

/**
 * Validates class code format
 * @param code - Class code to validate
 * @returns Object with { valid: boolean, error?: string }
 */
export function validateClassCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_CLASS_CODE }
  }

  const sanitized = sanitizeClassCode(code)

  if (sanitized.length !== CLASS_CODE_LENGTH) {
    return { valid: false, error: `Class code must be exactly ${CLASS_CODE_LENGTH} characters` }
  }

  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_CLASS_CODE }
  }

  return { valid: true }
}

/**
 * Validates roll number (basic validation)
 * @param rollNumber - Roll number to validate
 * @returns Object with { valid: boolean, error?: string }
 */
export function validateRollNumber(rollNumber: string): { valid: boolean; error?: string } {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_ROLL_NUMBER }
  }

  if (rollNumber.trim().length === 0) {
    return { valid: false, error: AUTH_ERRORS.INVALID_ROLL_NUMBER }
  }

  return { valid: true }
}

/**
 * Complete auth form validation
 * Validates email and password for sign in
 * @param email - Email to validate
 * @param password - Password to validate
 * @returns Object with { valid: boolean, errors: Record<string, string> }
 */
export function validateSignInForm(email: string, password: string): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || AUTH_ERRORS.INVALID_EMAIL
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
 * Complete auth form validation
 * Validates email and password for sign up
 * @param email - Email to validate
 * @param password - Password to validate
 * @param confirmPassword - Confirmation password to validate
 * @returns Object with { valid: boolean, errors: Record<string, string> }
 */
export function validateSignUpForm(email: string, password: string, confirmPassword: string): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || AUTH_ERRORS.INVALID_EMAIL
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error || AUTH_ERRORS.INVALID_PASSWORD
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
    errors.password = passwordValidation.error || AUTH_ERRORS.INVALID_PASSWORD
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
