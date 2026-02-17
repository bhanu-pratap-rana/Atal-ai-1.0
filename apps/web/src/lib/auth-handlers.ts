/**
 * Unified Authentication Handlers
 *
 * Centralizes all authentication flows (signin, signup, OTP verification)
 * into reusable, testable functions. This eliminates ~550+ lines of duplicate code.
 *
 * Benefits:
 * - Single source of truth for auth logic
 * - Consistent error handling across all flows
 * - Easier testing and debugging
 * - Type-safe across all handlers
 *
 * Follows rule.md: NO DUPLICATION, ARCHITECTURAL CONSISTENCY
 */

import { SupabaseClient, User, AuthError } from "@supabase/supabase-js";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "./validation-utils";
import { checkOtpRateLimit } from "./rate-limiter-distributed";
import { authLogger } from "./auth-logger";
export type { SignInResult as BaseSignInResult } from "@/types/auth";

/**
 * Extended signin result type for internal use
 * Extends the base type with additional fields needed by handlers
 */
export interface SignInResult {
  success: boolean;
  error?: string;
  user?: User;
  requiresProfileCheck?: boolean;
}

/**
 * Generic OTP result type
 */
export interface OTPResult {
  success: boolean;
  error?: string;
  user?: User;
  token?: string;
}

/**
 * Helper: Validate signin credentials
 */
function validateSignInCredentials(
  credentials: { email?: string; phone?: string; password: string },
  validatorFn?: (val: string) => { valid: boolean; error?: string },
): { valid: boolean; identifier?: string; error?: string } {
  const identifier = credentials.email || credentials.phone;
  if (!identifier) {
    return { valid: false, error: "Email or phone is required" };
  }

  if (validatorFn) {
    const validation = validatorFn(identifier);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error || "Invalid identifier",
      };
    }
  }

  return { valid: true, identifier };
}

/**
 * Helper: Perform signin with Supabase
 */
async function performSignInWithSupabase(
  supabase: SupabaseClient,
  credentials: { email?: string; phone?: string; password: string },
): Promise<{ data?: { user: User | null }; error?: AuthError } | null> {
  if (credentials.email) {
    const result = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return result as { data?: { user: User | null }; error?: AuthError };
  }

  if (credentials.phone) {
    const result = await supabase.auth.signInWithPassword({
      phone: credentials.phone,
      password: credentials.password,
    });
    return result as { data?: { user: User | null }; error?: AuthError };
  }

  return null;
}

/**
 * Helper: Check profile if required
 */
async function checkProfileIfRequired(
  supabase: SupabaseClient,
  userId: string,
  options?: { requireProfileCheck?: boolean; profileTable?: string },
): Promise<{
  valid: boolean;
  error?: string;
  requiresProfileCheck?: boolean;
}> {
  if (!options?.requireProfileCheck || !options?.profileTable) {
    return { valid: true };
  }

  // PERF-009 FIX: Select only user_id - we just need to check existence
  const { data: profile, error: profileError } = await supabase
    .from(options.profileTable)
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    authLogger.warn("[handleSignIn] Profile not found", {
      userId,
      table: options.profileTable,
    });
    return {
      valid: true,
      error: "Profile not found",
      requiresProfileCheck: true,
    };
  }

  return { valid: true };
}

/**
 * Unified email/phone signin handler
 * Replaces duplicate signin logic across student/teacher pages
 * REFACTORED: Reduced complexity from 16 to ~8 by extracting helper functions
 *
 * @param supabase - Supabase client instance
 * @param credentials - Email/phone and password
 * @param options - Configuration (validation, profile check, redirect)
 * @returns SignInResult with success status and optional user data
 *
 * WHY: Email and phone signin are 95% identical. This function consolidates
 * the common pattern (validate, call Supabase, check profile if needed)
 * while allowing page-specific customization through options.
 */
export async function handleSignIn(
  supabase: SupabaseClient,
  credentials: { email?: string; phone?: string; password: string },
  options?: {
    validatorFn?: (val: string) => { valid: boolean; error?: string };
    requireProfileCheck?: boolean; // For teacher role
    profileTable?: string; // Table to check (teacher_profiles, student_profiles, etc)
  },
): Promise<SignInResult> {
  try {
    // Validate credentials
    const validation = validateSignInCredentials(credentials, options?.validatorFn);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    authLogger.debug("[handleSignIn] Attempting signin", {
      type: credentials.email ? "email" : "phone",
    });

    // Perform signin
    const result = await performSignInWithSupabase(supabase, credentials);

    if (!result) {
      return { success: false, error: "Email or phone is required" };
    }

    const { data, error } = result;

    if (error) {
      authLogger.warn("[handleSignIn] Authentication failed", error);
      return {
        success: false,
        error: error.message || "Invalid credentials",
      };
    }

    if (!data?.user) {
      return {
        success: false,
        error: "Authentication failed - no user returned",
      };
    }

    authLogger.success("[handleSignIn] Authentication successful");

    // Check profile if required
    const profileCheck = await checkProfileIfRequired(
      supabase,
      data.user.id,
      options,
    );

    return {
      success: true,
      user: data.user,
      ...(profileCheck.error && { error: profileCheck.error }),
      ...(profileCheck.requiresProfileCheck && {
        requiresProfileCheck: true,
      }),
    };
  } catch (error) {
    authLogger.error("[handleSignIn] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Helper: Validate and check rate limit for OTP identifier
 */
async function validateAndCheckOtpLimit(
  identifier: string,
  channel: "email" | "phone",
  skipRateLimit?: boolean,
): Promise<{ valid: boolean; error?: string }> {
  if (channel === "email") {
    const validation = validateEmail(identifier);
    if (!validation.valid) {
      return { valid: false, error: validation.error || "Invalid email" };
    }
  } else {
    const validation = validatePhone(identifier);
    if (!validation.valid) {
      return { valid: false, error: validation.error || "Invalid phone" };
    }
  }

  if (!skipRateLimit) {
    const isRateLimitOk = await checkOtpRateLimit(identifier);
    if (!isRateLimitOk) {
      authLogger.warn("[handleSendOTP] Rate limit exceeded", { identifier });
      return {
        valid: false,
        error: "Too many OTP requests. Please wait before trying again.",
      };
    }
  }

  return { valid: true };
}

/**
 * Helper: Send OTP via Supabase based on channel
 */
async function sendOtpViaChannel(
  supabase: SupabaseClient,
  identifier: string,
  channel: "email" | "phone",
  options?: {
    redirectUrl?: string;
    shouldCreateUser?: boolean;
  },
): Promise<AuthError | null> {
  if (channel === "email") {
    const result = await supabase.auth.signInWithOtp({
      email: identifier.trim().toLowerCase(),
      options: {
        ...(options?.redirectUrl && { emailRedirectTo: options.redirectUrl }),
        shouldCreateUser: options?.shouldCreateUser ?? true,
      },
    });
    return result.error;
  }

  const result = await supabase.auth.signInWithOtp({
    phone: identifier,
    options: {
      shouldCreateUser: options?.shouldCreateUser ?? true,
    },
  });
  return result.error;
}

/**
 * Unified OTP send handler for email and phone
 * Replaces duplicate OTP send logic across multiple files
 * REFACTORED: Reduced complexity from 18 to ~7 by extracting helper functions
 *
 * @param supabase - Supabase client instance
 * @param identifier - Email or phone number to send OTP to
 * @param channel - 'email' or 'phone'
 * @param options - Configuration (rate limit check, redirect URL, etc)
 * @returns OTPResult with success status
 *
 * WHY: Email and phone OTP send have 80% identical code. This consolidates
 * the pattern while handling channel-specific details (validation, rate limiting).
 */
export async function handleSendOTP(
  supabase: SupabaseClient,
  identifier: string,
  channel: "email" | "phone",
  options?: {
    skipRateLimit?: boolean;
    redirectUrl?: string;
    shouldCreateUser?: boolean;
  },
): Promise<OTPResult> {
  try {
    // Validate and check rate limit
    const validation = await validateAndCheckOtpLimit(
      identifier,
      channel,
      options?.skipRateLimit,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    authLogger.debug(`[handleSendOTP] Sending ${channel} OTP`, { identifier });

    // Send OTP via channel-specific method
    const error = await sendOtpViaChannel(supabase, identifier, channel, options);

    if (error) {
      authLogger.warn("[handleSendOTP] OTP send failed", error);
      return {
        success: false,
        error: error.message || "Failed to send OTP",
      };
    }

    authLogger.success("[handleSendOTP] OTP sent successfully", { channel });
    return { success: true };
  } catch (error) {
    authLogger.error("[handleSendOTP] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Unified OTP verification handler for email and phone
 * Replaces duplicate OTP verify logic across multiple flows
 *
 * @param supabase - Supabase client instance
 * @param identifier - Object with email or phone that received the OTP
 * @param token - The OTP token to verify
 * @param channel - 'email' or 'sms'
 * @param options - Configuration (return user, role-based redirect, etc)
 * @returns OTPResult with verification status and optional user data
 *
 * WHY: OTP verification is repeated in 4 different places with 70% duplication.
 * This function handles the core verification while options allow different
 * post-verification behavior (redirect vs return user vs callback).
 */
export async function handleVerifyOTP(
  supabase: SupabaseClient,
  identifier: { email?: string; phone?: string },
  token: string,
  channel: "email" | "sms",
  options?: {
    returnUser?: boolean;
  },
): Promise<OTPResult> {
  try {
    const id = identifier.email || identifier.phone;
    if (!id) {
      return { success: false, error: "Email or phone is required" };
    }

    authLogger.debug("[handleVerifyOTP] Verifying OTP", { channel });

    // Call Supabase OTP verification
    let data: { user: User | null; session: unknown } | null = null;
    let error: AuthError | null = null;

    if (identifier.email) {
      const result = await supabase.auth.verifyOtp({
        email: identifier.email.toLowerCase(),
        token: token.trim(),
        type: channel as "email" | "signup",
      });
      data = result.data;
      error = result.error;
    } else if (identifier.phone) {
      const result = await supabase.auth.verifyOtp({
        phone: identifier.phone,
        token: token.trim(),
        type: "sms",
      });
      data = result.data;
      error = result.error;
    }

    // Guard: data is always set after the if/else-if above (early return on !id ensures
    // at least one branch executes), but TypeScript can't infer this
    if (!data) {
      return { success: false, error: "Email or phone is required" };
    }

    if (error) {
      authLogger.warn("[handleVerifyOTP] OTP verification failed", error);

      // Provide better error messages for common cases
      if (error.message.includes("expired")) {
        return {
          success: false,
          error: "That code has expired. Request a new one.",
        };
      }
      if (error.message.includes("invalid")) {
        return {
          success: false,
          error: "That code didn't work. Please check and try again.",
        };
      }

      return {
        success: false,
        error: error.message || "OTP verification failed",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Verification failed - no user data",
      };
    }

    authLogger.success("[handleVerifyOTP] OTP verification successful");

    if (options?.returnUser) {
      return {
        success: true,
        user: data.user,
      };
    }

    return { success: true };
  } catch (error) {
    authLogger.error("[handleVerifyOTP] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Unified password set/update handler
 * Replaces duplicate password setting logic in signup flows
 *
 * @param supabase - Supabase client instance
 * @param password - Password to set
 * @param validate - Whether to validate password strength first
 * @returns OTPResult with success status
 *
 * WHY: Both email and phone signup verify OTP then set password with
 * identical error handling. This consolidates that flow.
 */
export async function handleSetPassword(
  supabase: SupabaseClient,
  password: string,
  validate: boolean = true,
): Promise<OTPResult> {
  try {
    // Validate password if requested
    if (validate) {
      const validation = validatePassword(password);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(", ") || "Invalid password",
        };
      }
    }

    authLogger.debug("[handleSetPassword] Setting password");

    // Update user password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      authLogger.warn("[handleSetPassword] Password update failed", error);
      return {
        success: false,
        error: error.message || "Failed to set password",
      };
    }

    authLogger.success("[handleSetPassword] Password set successfully");
    return { success: true };
  } catch (error) {
    authLogger.error("[handleSetPassword] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Anonymous/guest signin handler
 * Used for users wanting to join classes without full registration
 *
 * @param supabase - Supabase client instance
 * @returns SignInResult with success status
 *
 * WHY: Simple anonymous signin pattern that may be used in multiple places.
 * Centralizing ensures consistent behavior.
 */
export async function handleAnonymousSignIn(
  supabase: SupabaseClient,
): Promise<SignInResult> {
  try {
    authLogger.debug("[handleAnonymousSignIn] Attempting anonymous signin");

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      authLogger.warn("[handleAnonymousSignIn] Anonymous signin failed", error);
      return {
        success: false,
        error: error.message || "Failed to sign in as guest",
      };
    }

    authLogger.success("[handleAnonymousSignIn] Anonymous signin successful");
    return { success: true };
  } catch (error) {
    authLogger.error("[handleAnonymousSignIn] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
