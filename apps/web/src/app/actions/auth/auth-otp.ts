"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkOtpRateLimit,
  checkOtpVerifyRateLimit,
  checkPasswordResetRateLimit,
  checkEnumerationRateLimit,
} from "@/lib/rate-limiter-distributed";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";
import {
  AuthEmailSchema,
  AuthPasswordSchema,
  OtpTokenSchema,
} from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { checkEmailExistsInAuth } from "./auth-verification";
import {
  validateWithSchema,
  validateEmailDomain,
  validateEmailSecurity,
  handleOtpRequestError,
} from "./auth-common";
import { maskEmail } from "@/lib/masking-utils";

/**
 * OTP-based authentication flows
 * Handles email-based OTP for signup, login, and password recovery
 */

/**
 * Helper: Validate and parse email input
 */
function validateEmailInput(
  email: string,
): { success: true; email: string } | { success: false; error: string } {
  const result = validateWithSchema(email, AuthEmailSchema);
  if (!result.success) {
    authLogger.debug("[requestOtp] Invalid email format", {
      error: result.error,
    });
  }
  return result.success ? { success: true, email: result.data } : result;
}

/**
 * Helper: Check rate limits (OTP and enumeration)
 */
async function checkRateLimits(
  email: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const otpAllowed = await checkOtpRateLimit(email);
  if (!otpAllowed) {
    authLogger.warn("[requestOtp] Rate limit exceeded", { type: "otp_limit" });
    return {
      allowed: false,
      error:
        "Too many OTP requests. Please wait an hour before requesting again.",
    };
  }

  const enumerationKey = `email:check:${email}`;
  const enumerationAllowed = await checkEnumerationRateLimit(enumerationKey);
  if (!enumerationAllowed) {
    // SEC-005 FIX: Use masked email to protect PII in logs
    authLogger.warn("[requestOtp] Email enumeration rate limit exceeded", {
      email: maskEmail(email),
      limitType: "enumeration",
    });
    return {
      allowed: false,
      error:
        "If this email is registered, check your inbox for a login link. If you don't have an account, you can create one.",
    };
  }

  return { allowed: true };
}

/**
 * Helper: Handle email enumeration check
 * CRITICAL: Prevents cross-role registration and handles incomplete registrations
 */
async function handleEmailEnumerationCheck(
  email: string,
): Promise<{ shouldProceed: true } | { shouldProceed: false; error: string }> {
  const emailCheck = await checkEmailExistsInAuth(email);

  authLogger.debug("[requestOtp] checkEmailExistsInAuth result", {
    email: maskEmail(email),
    exists: emailCheck.exists,
    role: emailCheck.role,
    hasStudentProfile: emailCheck.hasStudentProfile,
    hasTeacherProfile: emailCheck.hasTeacherProfile,
  });

  // BACKUP CHECK: Query public.users table directly
  // This is more reliable than auth.users lookup
  const adminClient = await createAdminClient();
  const { data: userByEmail } = await adminClient
    .from("users")
    .select("id, email, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  authLogger.debug("[requestOtp] Direct users table check", {
    email: maskEmail(email),
    foundUser: !!userByEmail,
    userRole: userByEmail?.role,
  });

  // If direct check finds a teacher in users table, block immediately
  if (userByEmail && userByEmail.role === "teacher") {
    authLogger.error(
      "[requestOtp] CRITICAL: Found teacher in users table - blocking student registration",
      {
        email: maskEmail(email),
        userId: userByEmail.id,
      },
    );
    return {
      shouldProceed: false,
      error:
        "This email is registered as a teacher account. Please use a different email for student registration, or reset your password if you forgot it.",
    };
  }

  // If direct check finds a student, block re-registration
  if (userByEmail && userByEmail.role === "student") {
    authLogger.warn("[requestOtp] Found student in users table", {
      email: maskEmail(email),
    });
    return {
      shouldProceed: false,
      error:
        "This email is already registered as a student. Please login with your email and password, or reset your password if you forgot it.",
    };
  }

  if (emailCheck.exists) {
    // SEC-005 FIX: Use masked email to protect PII in logs
    authLogger.warn(
      "[requestOtp] Email already exists in auth system",
      {
        email: maskEmail(email),
        role: emailCheck.role,
        hasStudentProfile: emailCheck.hasStudentProfile,
        hasTeacherProfile: emailCheck.hasTeacherProfile,
        sourceIP: "[IP_ADDRESS]",
      },
    );

    // CRITICAL: Block if user has ANY teacher indicator
    // Check both profile existence AND app_metadata role
    if (
      emailCheck.hasTeacherProfile ||
      emailCheck.role === "teacher" ||
      emailCheck.role === "admin" ||
      emailCheck.role === "super_admin"
    ) {
      authLogger.warn(
        "[requestOtp] Teacher/admin trying to register as student",
        {
          email: maskEmail(email),
          role: emailCheck.role,
        },
      );
      return {
        shouldProceed: false,
        error:
          "This email is registered as a teacher account. Please use a different email for student registration, or reset your password if you forgot it.",
      };
    }

    // If email has student profile, they should login instead
    if (emailCheck.hasStudentProfile || emailCheck.role === "student") {
      authLogger.info(
        "[requestOtp] Student trying to re-register",
        {
          email: maskEmail(email),
        },
      );
      return {
        shouldProceed: false,
        error:
          "This email is already registered as a student. Please login with your email and password, or reset your password if you forgot it.",
      };
    }

    // Email exists but role is unknown (auth.users exists but no profile yet)
    // Block anyway - they should complete existing registration or login
    if (emailCheck.role === "unknown") {
      authLogger.warn(
        "[requestOtp] Email exists with unknown role, blocking student registration",
        {
          email: maskEmail(email),
        },
      );
      return {
        shouldProceed: false,
        error:
          "This email is already registered. Please complete your existing registration or login. If you forgot your password, use the 'Forgot Password' link.",
      };
    }

    // Email exists but we couldn't determine role (should never happen)
    // Block anyway to be safe
    authLogger.error(
      "[requestOtp] Email exists but unable to determine role - blocking",
      {
        email: maskEmail(email),
      },
    );
    return {
      shouldProceed: false,
      error:
        "If this email is registered, check your inbox for a login link. If you don't have an account, you can create one.",
    };
  }

  return { shouldProceed: true };
}

/**
 * Request an OTP (One-Time Password) to be sent to the user's email address
 *
 * Validates the email, checks rate limits, and sends OTP via Supabase Auth.
 * Auto-creates the user if they don't exist yet.
 *
 * @param email - The email address to send OTP to
 * @returns Object with success status and error/role information if applicable
 *
 * @example
 * ```typescript
 * const result = await requestOtp('user@example.com')
 * if (result.success) {
 *   // OTP sent successfully, prompt user for OTP code
 * } else if (result.exists && result.role === 'teacher') {
 *   // Email is registered as teacher, direct to teacher login
 * } else {
 *   // Show error message to user
 *   showError(result.error)
 * }
 * ```
 */
export async function requestOtp(email: string) {
  try {
    const emailValidation = validateEmailInput(email);
    if (!emailValidation.success) {
      return emailValidation;
    }

    const domainValidation = validateEmailDomain(emailValidation.email);
    if (!domainValidation.valid) {
      return { success: false, error: domainValidation.error };
    }

    const rateLimitCheck = await checkRateLimits(emailValidation.email);
    if (!rateLimitCheck.allowed) {
      return { success: false, error: rateLimitCheck.error };
    }

    const securityValidation = validateEmailSecurity(emailValidation.email);
    if (!securityValidation.valid) {
      return { success: false, error: securityValidation.error };
    }

    const enumerationCheck = await handleEmailEnumerationCheck(
      emailValidation.email,
    );
    if (!enumerationCheck.shouldProceed) {
      return { success: false, error: enumerationCheck.error };
    }

    authLogger.debug("[requestOtp] Starting OTP request");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOtp({
      email: emailValidation.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, error: handleOtpRequestError(error) };
    }

    authLogger.success("[requestOtp] OTP sent successfully");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[requestOtp] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Verify OTP code and create session
 */
export async function verifyOtp(email: string, token: string) {
  try {
    // Validate inputs
    const emailResult = validateWithSchema(email, AuthEmailSchema);
    if (!emailResult.success) return emailResult;

    const tokenResult = validateWithSchema(token, OtpTokenSchema);
    if (!tokenResult.success) return tokenResult;

    const validatedEmail = emailResult.data;
    const validatedToken = tokenResult.data;

    authLogger.debug("[verifyOtp] Starting OTP verification");

    // SECURITY: Rate limit OTP verification to prevent brute-force attacks
    const verifyAllowed = await checkOtpVerifyRateLimit(validatedEmail);
    if (!verifyAllowed) {
      // SEC-005 FIX: Use masked email to protect PII in logs
      authLogger.warn("[verifyOtp] Rate limit exceeded", {
        email: maskEmail(validatedEmail),
      });
      return {
        success: false,
        error: "Too many verification attempts. Please try again later.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: validatedEmail,
      token: validatedToken,
      type: "email",
    });

    if (error) {
      authLogger.error("[verifyOtp] Verification failed", error);
      return { success: false, error: error.message };
    }

    // SECURITY: Only trust app_metadata.role (server-side set, immutable by client)
    // Never fall back to user_metadata.role as it can be client-modified
    const role = data.user?.app_metadata?.role || "student";
    authLogger.success("[verifyOtp] OTP verified successfully", { role });

    // Session is now created - check user role and redirect
    // Revalidate the layout to pick up the new session
    revalidatePath("/", "layout");

    authLogger.debug("[verifyOtp] Redirecting user", { role });

    // Redirect based on role - teachers, admins, and super_admins go to teacher classes
    if (isTeacherOrHigher(role)) {
      redirect("/app/teacher/classes");
    } else {
      redirect("/app/dashboard");
    }
  } catch (error) {
    // Next.js redirect() throws a NEXT_REDIRECT error which is expected behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw to allow the redirect to happen
    }

    authLogger.error("[verifyOtp] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Send forgot password OTP
 * Used for both teacher and student password recovery
 *
 * Users can reset password in two ways:
 * 1. Embedded form in /student/start or /teacher/start (main flow)
 * 2. Dedicated /reset-password page (alternative flow for email links)
 *
 * Email contains 6-digit OTP code. User manually enters it along with new password.
 *
 * Password requirements:
 * - Minimum 8 characters
 * - Maximum 64 characters (supports long passphrases)
 * - No complexity rules required
 *
 * @param email - User's email address
 * @returns Object with success status and error message if failed
 */
export async function sendForgotPasswordOtp(email: string) {
  try {
    // Validate email format using Zod schema
    const emailResult = validateWithSchema(email, AuthEmailSchema);
    if (!emailResult.success) return emailResult;

    const trimmedEmail = emailResult.data;

    // Check rate limit - prevent password reset spam/abuse
    const resetAllowed = await checkPasswordResetRateLimit(trimmedEmail);
    if (!resetAllowed) {
      authLogger.warn("[sendForgotPasswordOtp] Rate limit exceeded", {
        type: "password_reset_limit",
      });
      return {
        success: false,
        error:
          "Too many password reset requests. Please wait an hour before requesting again.",
      };
    }

    authLogger.debug("[sendForgotPasswordOtp] Sending recovery OTP");

    const supabase = await createClient();

    // Note: Using manual OTP entry (not magic link), so emailRedirectTo is not needed
    // Email contains 6-digit OTP that user enters manually
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: false, // Don't create user if doesn't exist
      },
    });

    if (error) {
      authLogger.error("[sendForgotPasswordOtp] Error", error);

      // SECURITY FIX: Prevent email enumeration
      // Always return success message regardless of whether email exists
      // This prevents attackers from discovering valid email addresses
      authLogger.info("[sendForgotPasswordOtp] Request processed", {
        emailDomain: trimmedEmail.split("@")[1], // Log domain for monitoring, not full email
      });
    }

    // Always return success message to prevent email enumeration
    authLogger.success("[sendForgotPasswordOtp] Request completed");
    return {
      success: true,
      message:
        "If this email is registered, you will receive a password reset code shortly.",
    };
  } catch (error) {
    authLogger.error("[sendForgotPasswordOtp] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Reset password with OTP verification
 * Validates OTP and updates user's password to a new one
 *
 * Password Validation:
 * - Minimum: 8 characters
 * - Maximum: 64 characters (supports long passphrases like "correct horse battery staple")
 * - No complexity rules enforced (no uppercase, lowercase, number, special char requirements)
 * - Breach checking via HaveIBeenPwned API (optional, Task 3.3)
 *
 * Security Features:
 * - OTP must be valid and not expired (Supabase manages expiry)
 * - OTP is single-use (Supabase invalidates after verification)
 * - All other sessions revoked after password reset (prevents account compromise)
 * - Current session kept active (user can proceed to dashboard)
 *
 * @param email - User's email address
 * @param token - 6-digit OTP code from email
 * @param newPassword - New password (must be 8-64 characters)
 * @returns Object with success status and error message if failed
 */
export async function resetPasswordWithOtp(
  email: string,
  token: string,
  newPassword: string,
) {
  try {
    // Validate inputs using Zod schemas (NIST 2025 compliant)
    const emailResult = validateWithSchema(email, AuthEmailSchema);
    if (!emailResult.success) return emailResult;

    const tokenResult = validateWithSchema(token, OtpTokenSchema);
    if (!tokenResult.success) return tokenResult;

    const passwordResult = validateWithSchema(newPassword, AuthPasswordSchema);
    if (!passwordResult.success) return passwordResult;

    const validatedEmail = emailResult.data;
    const validatedToken = tokenResult.data;

    authLogger.debug("[resetPasswordWithOtp] Starting password reset", {
      email: validatedEmail.slice(0, 5) + "...",
    });

    const supabase = await createClient();

    // First verify the OTP
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: validatedEmail,
      token: validatedToken,
      type: "email",
    });

    if (verifyError) {
      authLogger.error(
        "[resetPasswordWithOtp] OTP verification failed",
        verifyError,
      );
      return {
        success: false,
        error: "Invalid or expired recovery code. Please request a new one.",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Verification failed. Please try again.",
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      authLogger.error(
        "[resetPasswordWithOtp] Password update failed",
        updateError,
      );
      return {
        success: false,
        error: updateError.message,
      };
    }

    // SECURITY: Invalidate all OTHER sessions after password reset
    // This prevents any compromised sessions from remaining active
    // Use 'others' scope to keep the current (just-authenticated) session active
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "others",
      });
      if (signOutError) {
        // Log but don't fail - password was successfully reset
        authLogger.warn(
          "[resetPasswordWithOtp] Failed to revoke other sessions",
          signOutError,
        );
      } else {
        authLogger.debug(
          "[resetPasswordWithOtp] Other sessions revoked successfully",
        );
      }
    } catch (error_) {
      // Don't fail the password reset if session revocation fails
      authLogger.warn(
        "[resetPasswordWithOtp] Exception revoking other sessions",
        error_ instanceof Error ? error_ : { error: error_ },
      );
    }

    authLogger.success("[resetPasswordWithOtp] Password reset successfully");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    authLogger.error("[resetPasswordWithOtp] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
