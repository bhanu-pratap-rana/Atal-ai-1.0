/**
 * Masking Utilities - Centralized functions for masking sensitive data
 *
 * Used by:
 * - auth-logger.ts (authentication logging)
 * - client-logger.ts (browser logging)
 * - validation-utils.ts (re-exports for external use)
 *
 * Rule.md Compliance:
 * - Single source of truth for masking logic (Rule 2 - No duplication)
 * - Proper TypeScript types (Rule 6.42 - No any)
 */

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Mask email address for logging
 * Keeps first 2 characters of local part and full domain
 * @example "john.doe@example.com" => "jo***@example.com"
 */
export function maskEmail(email?: string): string {
  if (!email) return "unknown";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Mask phone number for logging
 * Keeps only last 4 digits for better identification
 * @example "+919876543210" => "***3210"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return "unknown";
  const cleaned = phone.replaceAll(/\D/g, "");
  if (cleaned.length < 4) return "****";
  return `***${cleaned.slice(-4)}`;
}

/**
 * Alias for maskPhone for compatibility with phone-validation.ts exports
 * Returns format: ***XXXX (last 4 digits)
 */
export const maskPhoneNumber = (phone: string): string =>
  maskPhone(phone) || "****";

/**
 * Mask user ID for logging
 * Keeps only first 8 characters
 * @example "abc12345-6789-..." => "abc12345..."
 */
export function maskUserId(id?: string): string {
  if (!id) return "unknown";
  return `${id.slice(0, 8)}...`;
}

/**
 * Mask token/OTP for logging
 * Keeps only first 20 characters (or less for short tokens)
 */
export function maskToken(token?: string): string {
  if (!token) return "unknown";
  if (token.length <= 20) return "***";
  return `${token.slice(0, 20)}...`;
}

/**
 * Recursively mask sensitive data in an object
 * Reserved for structured logging service integration
 * @param data - The data object to mask
 * @param depth - Current recursion depth (max 3 to prevent deep recursion)
 * @returns Masked copy of the data
 */
export function maskSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 3 || !data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, depth + 1));
  }

  const masked: LogContext = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    // TYPE-009 FIX: Add runtime type checks before calling masking functions
    const valueAsString = typeof value === "string" ? value : undefined;

    // Mask sensitive fields based on key name
    if (lowerKey.includes("email")) {
      masked[key] = maskEmail(valueAsString);
    } else if (lowerKey.includes("phone")) {
      masked[key] = maskPhone(valueAsString);
    } else if (lowerKey.includes("password") || lowerKey.includes("pwd")) {
      masked[key] = "***";
    } else if (lowerKey.includes("token") || lowerKey.includes("otp")) {
      masked[key] = maskToken(valueAsString);
    } else if (lowerKey === "id" || lowerKey.includes("user_id")) {
      masked[key] = maskUserId(valueAsString);
    } else if (typeof value === "object") {
      masked[key] = maskSensitiveData(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
