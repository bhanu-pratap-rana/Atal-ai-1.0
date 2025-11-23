/**
 * Common Validation Patterns & Utilities
 *
 * Centralized validation functions used across ATAL AI
 * Ensures consistency, maintainability, and DRY principles
 *
 * Categories:
 * - Email validation
 * - Password validation
 * - Code validation (school codes, class codes)
 * - PIN validation
 * - Phone number validation
 * - Name validation
 */

/**
 * Email Validation
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const VALID_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'mail.com',
  'aol.com',
  'protonmail.com',
  'icloud.com',
]

export const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr',
  'jp', 'cn', 'io', 'ai', 'tv', 'cc', 'ws', 'me',
]

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Object with validity and error message
 */
export function validateEmail(email: string): {
  valid: boolean
  error?: string
} {
  const trimmedEmail = email.trim().toLowerCase()

  // Check basic format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Email must have format: user@example.com',
    }
  }

  // Check length
  if (trimmedEmail.length > 254) {
    return {
      valid: false,
      error: 'Email is too long',
    }
  }

  // Extract domain
  const domain = trimmedEmail.split('@')[1]
  if (!domain) {
    return {
      valid: false,
      error: 'Invalid email domain',
    }
  }

  // Validate domain
  const isValidDomain = isValidEmailDomain(domain)
  if (!isValidDomain) {
    return {
      valid: false,
      error: 'Email domain is not recognized',
    }
  }

  return { valid: true }
}

/**
 * Validate email domain
 * @param domain - Email domain to validate
 * @returns boolean - True if domain is valid
 */
export function isValidEmailDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase()

  // Check against known providers
  if (VALID_EMAIL_PROVIDERS.some(provider =>
    lowerDomain === provider || lowerDomain.endsWith('.' + provider)
  )) {
    return true
  }

  // Check domain structure
  const domainParts = lowerDomain.split('.')
  if (domainParts.length < 2) return false

  // Check for empty parts
  if (domainParts.some(part => part.length === 0)) return false

  // Check TLD
  const tld = domainParts[domainParts.length - 1]
  if (!VALID_TLDS.includes(tld)) return false

  // Check domain name (first part)
  const domainName = domainParts[0]
  if (domainName.length < 2) return false

  return true
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

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`At least ${requirements.minLength} characters`)
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('One uppercase letter (A-Z)')
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('One lowercase letter (a-z)')
  }

  // Check number
  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('One number (0-9)')
  }

  // Check special character
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

  // Length score (max 40 points)
  if (password.length >= 8) score += 10
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 20

  // Character variety score (max 60 points)
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
 * @param code - Code to validate
 * @returns Object with validity and error message
 */
export function validateClassCode(code: string): {
  valid: boolean
  error?: string
} {
  const trimmedCode = code.toUpperCase()

  if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
    return {
      valid: false,
      error: 'Class code must be 6 characters',
    }
  }

  return { valid: true }
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
 * Phone Number Validation
 */

/**
 * Validate phone number format
 * Accepts: +1234567890, 1234567890, (123) 456-7890
 * @param phone - Phone number to validate
 * @returns Object with validity and error message
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

  // Format as +1234567890
  const normalized = '+' + cleaned.slice(-12)

  return {
    valid: true,
    normalized,
  }
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

  // Check length
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

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
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
  const trimmedRollNumber = rollNumber.toUpperCase()

  if (trimmedRollNumber.length < 2 || trimmedRollNumber.length > 20) {
    return {
      valid: false,
      error: 'Roll number must be between 2 and 20 characters',
    }
  }

  if (!/^[A-Z0-9-]+$/.test(trimmedRollNumber)) {
    return {
      valid: false,
      error: 'Roll number can only contain letters, numbers, and hyphens',
    }
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

  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email'
  }

  // Validate password
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors.join(', ')
  }

  // Validate name
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

  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email'
  }

  // Validate password is not empty
  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
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
