/**
 * NIST 2025 Compliant Password Utilities
 *
 * Implements password validation following NIST Special Publication 800-63B
 * (Digital Identity Guidelines - Authentication and Lifecycle Management)
 *
 * Key Principles:
 * - Length is more important than complexity
 * - Breach checking more effective than arbitrary rules
 * - Privacy-preserving k-anonymity approach
 * - Accessible to all users (including those with disabilities)
 *
 * References:
 * - https://pages.nist.gov/800-63-3/sp800-63b.html
 * - HaveIBeenPwned API: https://haveibeenpwned.com/API/v3
 */

import { authLogger } from "./auth-logger";

import * as crypto from "node:crypto";

/**
 * Password Validation Rules
 */
export const NIST_2025_PASSWORD_RULES = {
  minLength: 8, // Minimum 8 characters (reasonable for educational platform)
  maxLength: 64, // Support long passphrases
  requireUppercase: false, // NOT required (prefer length over complexity)
  requireLowercase: false, // NOT required (prefer length over complexity)
  requireNumbers: false, // NOT required (prefer length over complexity)
  requireSpecialChars: false, // NOT required (prefer length over complexity)
} as const;

/**
 * Check if a password has been exposed in a data breach
 * Uses HaveIBeenPwned API with k-anonymity (privacy-preserving)
 *
 * How it works:
 * 1. Hash password with SHA-1
 * 2. Send first 5 characters of hash to API
 * 3. API returns list of hashes starting with those 5 characters
 * 4. Check if our full hash is in the list
 * 5. API never sees the full hash
 *
 * @param password - The password to check
 * @returns true if password is breached, false otherwise (also false on API error)
 *
 * @example
 * ```typescript
 * const isBreached = await isPasswordBreached('password123')
 * if (isBreached) {
 *   console.log('This password has been exposed in a data breach')
 * }
 * ```
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    // Hash the password using SHA-1 (required by HaveIBeenPwned API)
    // NOSONAR S4790: SHA-1 is REQUIRED by HaveIBeenPwned k-anonymity protocol - NOT used for password storage
    const sha1Hash = crypto
      .createHash("sha1") // NOSONAR
      .update(password)
      .digest("hex")
      .toUpperCase();

    // Use k-anonymity: only send first 5 characters
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);

    // Call HaveIBeenPwned API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Atal-AI-Educational-Platform/1.0",
        },
        // Timeout after 5 seconds to not block user
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      // API error or rate limit - don't block user
      authLogger.warn("[isPasswordBreached] API returned non-200 status", {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    // Parse response - format is: HASH:COUNT\r\n
    const text = await response.text();
    const hashes = text.split("\r\n");

    // Check if our suffix appears in the list
    // This means our full hash has been seen in breaches
    const isBreached = hashes.some((line) => {
      const [hashSuffix] = line.split(":");
      return hashSuffix === suffix;
    });

    if (isBreached) {
      authLogger.info("[isPasswordBreached] Password found in breach database");
    }

    return isBreached;
  } catch (error) {
    // Network error, timeout, or parsing error
    // Don't block user - let them proceed with warning
    authLogger.warn("[isPasswordBreached] Exception checking password breach", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get password validation error message following NIST 2025
 *
 * Returns specific error message if password fails validation
 * Returns null if password is valid (passes basic checks)
 *
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 *
 * @example
 * ```typescript
 * const error = getPasswordValidationError('short')
 * console.log(error) // "Password must be at least 12 characters"
 * ```
 */
export function getPasswordValidationError(password: string): string | null {
  if (password.length < NIST_2025_PASSWORD_RULES.minLength) {
    return `Password must be at least ${NIST_2025_PASSWORD_RULES.minLength} characters`;
  }

  if (password.length > NIST_2025_PASSWORD_RULES.maxLength) {
    return `Password is too long (maximum ${NIST_2025_PASSWORD_RULES.maxLength} characters)`;
  }

  return null;
}

// Alias for backward compatibility
export const NIST_2025_MIN_PASSWORD_LENGTH = NIST_2025_PASSWORD_RULES.minLength;

/**
 * Validate password with optional breach checking
 *
 * Performs NIST 2025 compliant validation:
 * 1. Check minimum length (12 chars)
 * 2. Check maximum length (64 chars)
 * 3. Optional: Check against breach database
 *
 * Does NOT check for:
 * - Uppercase letters ✗ (NIST discourages)
 * - Lowercase letters ✗ (NIST discourages)
 * - Numbers ✗ (NIST discourages)
 * - Special characters ✗ (NIST discourages)
 *
 * @param password - The password to validate
 * @param checkBreach - Whether to check HaveIBeenPwned (default: false for speed)
 * @returns Object with valid flag and optional error message
 *
 * @example
 * ```typescript
 * // Quick validation (no breach check)
 * const result = validatePasswordNist2025('correct horse battery staple')
 * console.log(result) // { valid: true, error: null }
 *
 * // Full validation with breach checking
 * const result = await validatePasswordNist2025('correct horse battery staple', true)
 * console.log(result) // { valid: true, isBreached: false }
 * ```
 */
export async function validatePasswordNist2025(
  password: string,
  checkBreach: boolean = false,
): Promise<{
  valid: boolean;
  error?: string;
  isBreached?: boolean;
}> {
  // Check length requirements
  const lengthError = getPasswordValidationError(password);
  if (lengthError) {
    return {
      valid: false,
      error: lengthError,
    };
  }

  // Optional: Check against breach database
  if (checkBreach) {
    try {
      const isBreached = await isPasswordBreached(password);
      if (isBreached) {
        return {
          valid: false,
          error:
            "This password has been exposed in a data breach. Please choose a different password.",
          isBreached: true,
        };
      }
      return {
        valid: true,
        isBreached: false,
      };
    } catch (error) {
      // If breach check fails, still allow password but log warning
      authLogger.warn(
        "[validatePasswordNist2025] Error checking breach database",
        error instanceof Error ? error : { error: String(error) },
      );
      return {
        valid: true,
        isBreached: undefined, // Unknown due to error
      };
    }
  }

  return {
    valid: true,
    error: undefined,
  };
}

/**
 * Estimate password strength (0-100) using NIST principles
 *
 * Scoring favors:
 * - Length (most important)
 * - Variety of character types (secondary)
 *
 * Does NOT penalize missing uppercase/lowercase/numbers
 *
 * @param password - The password to score
 * @returns Strength score from 0-100
 */
export function estimatePasswordStrengthNist2025(password: string): number {
  let score = 0;

  // Length scoring (most important)
  if (password.length >= 12) score += 30; // Minimum requirement
  if (password.length >= 16) score += 15; // Longer passphrases
  if (password.length >= 20) score += 15; // Very long passphrases
  if (password.length >= 30) score += 10; // Extreme length

  // Character diversity (not required, but encouraged)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const diversity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;
  score += diversity * 5; // Each type adds 5 points (max 20)

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Get human-readable password strength label
 *
 * @param score - Strength score (0-100)
 * @returns Strength label
 */
export function getPasswordStrengthLabelNist2025(score: number): string {
  if (score < 30) return "Weak";
  if (score < 50) return "Fair";
  if (score < 70) return "Good";
  if (score < 85) return "Strong";
  return "Very Strong";
}
