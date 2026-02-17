/**
 * Centralized Validation Utilities - Main Export & Utilities
 *
 * This file re-exports validation functions from specialized modules
 * for backward compatibility and provides general utility functions.
 *
 * Validation modules (for large file refactoring per rule.md):
 * - email-validation.ts - Email format, domain, typo detection (155 lines)
 * - password-utils.ts - NIST 2025 compliant password validation (268 lines)
 * - phone-validation.ts - Phone number format (87 lines)
 * - code-validation.ts - Class codes, PINs, OTPs (130 lines)
 * - name-validation.ts - Names, roll numbers (55 lines)
 *
 * Main file: validation-utils.ts (re-exports + utilities, ~67 lines)
 * Total: ~617 lines properly split across modules ✓
 */

// Re-export from specialized modules for backward compatibility
export {
  VALID_TLDS,
  detectDomainTypo,
  isValidEmailDomain,
  validateEmail,
  normalizeEmail,
  maskEmail,
} from "./email-validation";

// Password validation - NIST 2025 Compliant
import {
  getPasswordValidationError,
  estimatePasswordStrengthNist2025,
  getPasswordStrengthLabelNist2025,
} from "./password-utils";

export {
  validatePasswordNist2025,
  getPasswordValidationError,
  estimatePasswordStrengthNist2025,
  getPasswordStrengthLabelNist2025,
  isPasswordBreached,
  NIST_2025_PASSWORD_RULES,
  NIST_2025_MIN_PASSWORD_LENGTH,
} from "./password-utils";

// Backward compatibility wrappers for legacy code
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const error = getPasswordValidationError(password);
  return {
    valid: !error,
    errors: error ? [error] : [],
  };
}

export function calculatePasswordStrength(password: string): number {
  return estimatePasswordStrengthNist2025(password);
}

export function getPasswordStrengthLabel(score: number): string {
  return getPasswordStrengthLabelNist2025(score);
}

export function validatePasswordSimple(password: string): {
  valid: boolean;
  error?: string;
} {
  const error = getPasswordValidationError(password);
  return {
    valid: !error,
    error: error ?? undefined,
  };
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): { valid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}

// CLEANUP: Removed unused PasswordRequirements, DEFAULT_PASSWORD_REQUIREMENTS, PASSWORD_SPECIAL_CHARS
// These were legacy types that are no longer used (NIST 2025 compliance replaced them)

export {
  validatePhoneNumber,
  sanitizePhone,
  validatePhone,
  maskPhoneNumber,
  validateOptionalPhone,
  sanitizeProfilePhone,
} from "./phone-validation";

export {
  // CLEANUP: Removed validateSchoolCode (never used)
  validateClassCode,
  sanitizeClassCode,
  validatePIN,
  sanitizePIN,
  sanitizeOTP,
  validateOTP,
} from "./code-validation";

// CLEANUP: Removed name-validation.ts re-exports (validateName, validateRollNumber, sanitizeString)
// These functions were never used by any consumer
