/**
 * Centralized Validation Utilities - Main Export & Utilities
 *
 * This file re-exports validation functions from specialized modules
 * for backward compatibility and provides general utility functions.
 *
 * Validation modules (for large file refactoring per rule.md):
 * - email-validation.ts - Email format, domain, typo detection (155 lines)
 * - password-validation.ts - Password strength, requirements (110 lines)
 * - phone-validation.ts - Phone number format (87 lines)
 * - code-validation.ts - Class codes, PINs, OTPs (130 lines)
 * - name-validation.ts - Names, roll numbers (55 lines)
 * - form-validation.ts - Multi-field form validation (165 lines)
 *
 * Main file: validation-utils.ts (re-exports + utilities, ~80 lines)
 * Total: ~782 lines split → main file now ~80 lines ✓
 */

// Re-export from specialized modules for backward compatibility
export {
  VALID_TLDS,
  detectDomainTypo,
  isValidEmailDomain,
  validateEmail,
  normalizeEmail,
  maskEmail,
} from './email-validation'

export type {
  PasswordRequirements,
} from './password-validation'

export {
  DEFAULT_PASSWORD_REQUIREMENTS,
  PASSWORD_SPECIAL_CHARS,
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validatePasswordSimple,
  validatePasswordMatch,
} from './password-validation'

export {
  validatePhoneNumber,
  sanitizePhone,
  validatePhone,
  maskPhoneNumber,
} from './phone-validation'

export {
  validateSchoolCode,
  validateClassCode,
  sanitizeClassCode,
  validatePin,
  validatePIN,
  sanitizePIN,
  sanitizeOTP,
  validateOTP,
} from './code-validation'

export {
  validateName,
  validateRollNumber,
  sanitizeString,
} from './name-validation'

export type {
  RegistrationFormData,
  SignInFormData,
} from './form-validation'

export {
  validateRegistrationForm,
  validateSignInForm,
  validatePhoneSignInForm,
  validatePhoneSignUpForm,
  validateJoinClassForm,
  formatValidationErrors,
} from './form-validation'

/**
 * General utility function for equality checks
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
