import { z } from "zod";
import {
  BLOCKED_EMAIL_DOMAINS,
  COMMON_DOMAIN_TYPOS,
} from "@/lib/auth-constants";
import { isValidEmailDomain } from "@/lib/email-validation";
import { authLogger } from "@/lib/auth-logger";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

/**
 * Shared authentication utilities and helpers
 */

/**
 * Helper: Validate input with Zod schema
 * Eliminates duplicated Zod error handling across auth functions
 */
export function validateWithSchema<T>(
  input: unknown,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(input);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    throw error;
  }
}

/**
 * Helper: Validate email domain
 */
export function validateEmailDomain(
  email: string,
): { valid: true } | { valid: false; error: string } {
  const emailDomain = email.split("@")[1];
  if (!emailDomain || !isValidEmailDomain(emailDomain)) {
    authLogger.debug("[requestOtp] Invalid email domain");
    return {
      valid: false,
      error:
        "Please enter a valid email address from a recognized email provider.",
    };
  }
  return { valid: true };
}

/**
 * Helper: Check for blocked domains and suspicious patterns
 */
export function validateEmailSecurity(
  email: string,
): { valid: true } | { valid: false; error: string } {
  const domain = email.split("@")[1];

  if (domain && BLOCKED_EMAIL_DOMAINS.has(domain?.toLowerCase())) {
    authLogger.debug("[requestOtp] Blocked domain detected");

    if (COMMON_DOMAIN_TYPOS[domain]) {
      const suggestedEmail = email.replaceAll(
        domain,
        COMMON_DOMAIN_TYPOS[domain],
      );
      authLogger.warn("[requestOtp] Possible typo detected in email domain");
      return {
        valid: false,
        error: `Did you mean ${suggestedEmail}? Please check your email address.`,
      };
    }

    return {
      valid: false,
      error:
        "Please enter a valid email address from a recognized email provider.",
    };
  }

  const suspiciousPatterns = [
    "test@",
    "fake@",
    "example@",
    "spam@",
    "temp@",
    "disposable@",
  ];
  if (suspiciousPatterns.some((pattern) => email.startsWith(pattern))) {
    authLogger.debug("[requestOtp] Suspicious email pattern detected");
    return {
      valid: false,
      error: "Please use a valid email address.",
    };
  }

  return { valid: true };
}

// UNUSED-003 FIX: Removed duplicate maskEmail function
// Use import { maskEmail } from "@/lib/masking-utils" instead

/**
 * Helper: Handle Supabase OTP request errors
 */
export function handleOtpRequestError(error: {
  message: string;
  status?: number;
  name?: string;
}): string {
  authLogger.error("[requestOtp] Supabase error", error, {
    status: error.status,
    name: error.name,
  });

  if (error.message.includes("rate limit")) {
    return RATE_LIMIT_ERRORS.WAIT_FEW_MINUTES;
  }
  if (
    error.message.includes("Email provider") ||
    error.message.includes("email")
  ) {
    return "Email service issue. Please check Supabase dashboard Auth settings.";
  }
  if (error.message.includes("Invalid email")) {
    return "Please enter a valid email address.";
  }

  return error.message;
}
