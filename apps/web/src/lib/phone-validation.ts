/**
 * Phone Number Validation Utilities
 *
 * Handles phone number format validation (generic and India-specific),
 * sanitization, and masking for logging
 */

import {
  PHONE_COUNTRY_CODE,
  PHONE_DIGIT_LENGTH,
  AUTH_ERRORS,
} from "./auth-constants";

/**
 * Validate phone number format (generic - international)
 * Accepts: +1234567890, 1234567890, (123) 456-7890
 */
export function validatePhoneNumber(phone: string): {
  valid: boolean;
  error?: string;
  normalized?: string;
} {
  const cleaned = phone.replaceAll(/\D/g, "");

  if (cleaned.length < 10) {
    return {
      valid: false,
      error: "Phone number must be at least 10 digits",
    };
  }

  if (cleaned.length > 15) {
    return {
      valid: false,
      error: "Phone number is too long",
    };
  }

  const normalized = "+" + cleaned.slice(-12);

  return {
    valid: true,
    normalized,
  };
}

/**
 * Sanitizes phone input - strips non-digits and enforces country code
 * India-specific implementation
 * Handles: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 */
export function sanitizePhone(input: string): string {
  // Remove all non-digit characters
  let digitsOnly = input.replaceAll(/\D/g, "");

  // Remove leading country code variants
  if (digitsOnly.startsWith("91") && digitsOnly.length > PHONE_DIGIT_LENGTH) {
    digitsOnly = digitsOnly.slice(2);
  } else if (
    digitsOnly.startsWith("0") &&
    digitsOnly.length > PHONE_DIGIT_LENGTH
  ) {
    // Handle numbers starting with 0 (local format)
    digitsOnly = digitsOnly.slice(1);
  }

  // Return with country code prefix, limited to correct length
  return `${PHONE_COUNTRY_CODE}${digitsOnly.slice(0, PHONE_DIGIT_LENGTH)}`;
}

/**
 * Validates phone number format (India-specific)
 */
export function validatePhone(phone: string): {
  valid: boolean;
  error?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE };
  }

  const sanitized = sanitizePhone(phone);

  if (sanitized.length !== PHONE_COUNTRY_CODE.length + PHONE_DIGIT_LENGTH) {
    return {
      valid: false,
      error: `Phone number must be ${PHONE_DIGIT_LENGTH} digits`,
    };
  }

  if (!sanitized.startsWith(PHONE_COUNTRY_CODE)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE };
  }

  const digitsOnly = sanitized.slice(PHONE_COUNTRY_CODE.length);
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_PHONE };
  }

  return { valid: true };
}

// Re-export maskPhoneNumber from centralized masking-utils for consistency
// This ensures consistent 2-digit masking across the entire application
export { maskPhoneNumber } from "./masking-utils";

/**
 * Validates optional phone number for profile forms
 * Returns valid if empty, validates format if provided
 * @param phone - Phone number to validate (can be empty)
 * @returns Validation result with error message if invalid
 */
export function validateOptionalPhone(phone: string | undefined | null): {
  valid: boolean;
  error?: string;
} {
  // Empty is valid for optional fields
  if (!phone || phone.trim() === "") {
    return { valid: true };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replaceAll(/\D/g, "");

  // Check if it's exactly 10 digits
  if (digitsOnly.length === 0) {
    return { valid: true }; // Empty after cleaning is ok
  }

  if (digitsOnly.length < PHONE_DIGIT_LENGTH) {
    return {
      valid: false,
      error: `Phone number must be ${PHONE_DIGIT_LENGTH} digits (currently ${digitsOnly.length})`,
    };
  }

  if (digitsOnly.length > PHONE_DIGIT_LENGTH) {
    return {
      valid: false,
      error: `Phone number must be ${PHONE_DIGIT_LENGTH} digits only (currently ${digitsOnly.length})`,
    };
  }

  // Valid Indian mobile numbers start with 6, 7, 8, or 9
  const firstDigit = digitsOnly[0];
  if (!firstDigit || !["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      valid: false,
      error: "Please enter a valid Indian mobile number",
    };
  }

  return { valid: true };
}

/**
 * Sanitizes phone input for profile forms - strips non-digits and limits to 10
 * @param input - Raw phone input
 * @returns Cleaned phone number (digits only, max 10)
 */
export function sanitizeProfilePhone(input: string): string {
  const digitsOnly = input.replaceAll(/\D/g, "");
  return digitsOnly.slice(0, PHONE_DIGIT_LENGTH);
}
