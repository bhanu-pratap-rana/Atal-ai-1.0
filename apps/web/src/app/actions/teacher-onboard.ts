"use server";

import {
  createClient,
  createAdminClient,
  getCurrentUser,
} from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkEmailExistsInAuth } from "@/app/actions/auth";
import {
  checkOtpRateLimit,
  checkTeacherOnboardRateLimit,
} from "@/lib/rate-limiter-distributed";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

// Types
export interface SendEmailOtpResult {
  success: boolean;
  error?: string;
  exists?: boolean;
}

export interface VerifyEmailOtpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export interface SetPasswordResult {
  success: boolean;
  error?: string;
}

export interface SaveTeacherProfileParams {
  name: string;
  gender: "male" | "female";
  phone?: string;
  subject?: string;
  village?: string;
  schoolId: string;
  schoolCode: string;
}

export interface UpdateTeacherProfileParams {
  name: string;
  gender: "male" | "female";
  phone?: string;
  subject?: string;
  village?: string;
}

export interface SaveTeacherProfileResult {
  success: boolean;
  error?: string;
}

/**
 * Send Email OTP for teacher registration
 * Step 1A: Email field → "Send code"
 * Now includes check if email already exists using reliable auth check
 */
export async function sendEmailOtp(email: string): Promise<SendEmailOtpResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const supabase = await createClient();

    // Rate limit check - prevent OTP spam
    const otpAllowed = await checkOtpRateLimit(trimmedEmail);
    if (!otpAllowed) {
      authLogger.warn("[sendEmailOtp] Rate limit exceeded", {
        email: trimmedEmail,
      });
      return {
        success: false,
        error:
          "Too many OTP requests. Please wait an hour before requesting again.",
      };
    }

    // CRITICAL: Check if email already exists in auth system
    // Prevent cross-role registration and handle incomplete registrations
    const emailCheck = await checkEmailExistsInAuth(trimmedEmail);

    authLogger.debug("[sendEmailOtp] checkEmailExistsInAuth result", {
      email: trimmedEmail,
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
      .eq("email", trimmedEmail)
      .maybeSingle();

    authLogger.debug("[sendEmailOtp] Direct users table check", {
      email: trimmedEmail,
      foundUser: !!userByEmail,
      userRole: userByEmail?.role,
    });

    // If direct check finds a student in users table, block immediately
    if (userByEmail && userByEmail.role === "student") {
      authLogger.error(
        "[sendEmailOtp] CRITICAL: Found student in users table - blocking teacher registration",
        {
          email: trimmedEmail,
          userId: userByEmail.id,
        },
      );
      return {
        success: false,
        error:
          "This email is registered as a student account. Please use a different email for teacher registration, or reset your password if you forgot it.",
        exists: true,
      };
    }

    // If direct check finds a teacher, block re-registration
    if (userByEmail && userByEmail.role === "teacher") {
      authLogger.warn("[sendEmailOtp] Found teacher in users table", {
        email: trimmedEmail,
      });
      return {
        success: false,
        error:
          "This email is already registered as a teacher. Please login with your email and password, or reset your password if you forgot it.",
        exists: true,
      };
    }

    if (emailCheck.exists) {
      authLogger.warn("[sendEmailOtp] Email already exists in auth system", {
        email: trimmedEmail,
        role: emailCheck.role,
        hasStudentProfile: emailCheck.hasStudentProfile,
        hasTeacherProfile: emailCheck.hasTeacherProfile,
      });

      // CRITICAL: Block if user has ANY student indicator
      // Check both profile existence AND app_metadata role
      if (
        emailCheck.hasStudentProfile ||
        emailCheck.role === "student" ||
        emailCheck.role === "unknown"
      ) {
        // If they have a student profile, definitely block
        if (emailCheck.hasStudentProfile) {
          authLogger.warn(
            "[sendEmailOtp] Student with profile trying to register as teacher",
            { email: trimmedEmail },
          );
          return {
            success: false,
            error:
              "This email is registered as a student account. Please use a different email for teacher registration, or reset your password if you forgot it.",
            exists: true,
          };
        }

        // If role is student but no profile yet (incomplete registration),
        // or role is unknown (auth.users exists but no profile), block anyway
        authLogger.warn(
          "[sendEmailOtp] Email exists with student/unknown role, blocking teacher registration",
          {
            email: trimmedEmail,
            role: emailCheck.role,
          },
        );
        return {
          success: false,
          error:
            "This email is already registered. Please complete your existing registration or login. If you forgot your password, use the 'Forgot Password' link.",
          exists: true,
        };
      }

      // If email has teacher profile, they should login instead
      if (emailCheck.hasTeacherProfile || emailCheck.role === "teacher") {
        authLogger.info("[sendEmailOtp] Teacher trying to re-register", {
          email: trimmedEmail,
        });
        return {
          success: false,
          error:
            "This email is already registered as a teacher. Please login with your email and password, or reset your password if you forgot it.",
          exists: true,
        };
      }

      // Email exists but we couldn't determine role (should never happen)
      // Block anyway to be safe
      authLogger.error(
        "[sendEmailOtp] Email exists but unable to determine role - blocking",
        {
          email: trimmedEmail,
        },
      );
      return {
        success: false,
        error:
          "This email is already registered. Please login with your email and password, or reset your password if you forgot it.",
        exists: true,
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      authLogger.error("[sendEmailOtp] Auth error", { error: error.message });
      return { success: false, error: "Failed to send OTP. Please try again." };
    }

    authLogger.success("[sendEmailOtp] OTP sent successfully");
    return { success: true };
  } catch (error) {
    authLogger.error("[sendEmailOtp] Unexpected error", error);
    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}

/**
 * Verify Email OTP
 * Step 1B: 6-digit OTP input → verify
 */
export async function verifyEmailOtp({
  email,
  token,
}: {
  email: string;
  token: string;
}): Promise<VerifyEmailOtpResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      authLogger.error("[Verify Email OTP] Supabase error", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      // User-friendly error messages based on error type
      if (
        error.status === 406 ||
        error.message.includes("expired") ||
        error.message.includes("invalid") ||
        error.message.includes("Token")
      ) {
        return {
          success: false,
          error:
            "That code didn't work or has expired. Please request a new one.",
        };
      }
      if (error.message.includes("rate") || error.status === 429) {
        return {
          success: false,
          error:
            "Too many attempts. Please wait a few minutes before trying again.",
        };
      }
      return { success: false, error: "Verification failed. Please try again." };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Verification failed. Please try again.",
      };
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    authLogger.error("[Verify Email OTP] Unexpected error", error);
    return {
      success: false,
      error: "Failed to verify OTP. Please try again.",
    };
  }
}

/**
 * Set password after OTP verification
 * Step 1C: "Create password" (min 8, zxcvbn hint) → set
 * UX: show "Why a password?" (recovery & multi-device access)
 */
export async function setPassword(
  password: string,
): Promise<SetPasswordResult> {
  try {
    // 1. Verify user is authenticated
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Not authenticated. Please sign in again.",
      };
    }

    // SECURITY: Rate limit onboarding operations to prevent abuse
    const passwordAllowed = await checkTeacherOnboardRateLimit(user.id);
    if (!passwordAllowed) {
      authLogger.warn("[setPassword] Rate limit exceeded", { userId: user.id });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    // 2. Validate password (min 8 chars)
    if (!password || password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long.",
      };
    }

    // 3. Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    authLogger.error("[Set Password] Unexpected error", error);
    return {
      success: false,
      error: "Failed to set password. Please try again.",
    };
  }
}

/**
 * Save teacher profile after school verification
 * Step 3: Insert/update teacher_profiles row
 * RLS uses auth.uid() for ownership
 */
export async function saveTeacherProfile({
  name,
  gender,
  phone,
  subject,
  village,
  schoolId,
  schoolCode,
}: SaveTeacherProfileParams): Promise<SaveTeacherProfileResult> {
  try {
    // 1. Get current user
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // SECURITY: Rate limit onboarding operations to prevent abuse
    const profileAllowed = await checkTeacherOnboardRateLimit(user.id);
    if (!profileAllowed) {
      authLogger.warn("[saveTeacherProfile] Rate limit exceeded", {
        userId: user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    // 2. Check if profile already exists
    // Use .maybeSingle() instead of .single() - .single() throws PGRST116 when no rows found
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileCheckError) {
      authLogger.error(
        "[Save Profile] Error checking existing profile",
        profileCheckError,
      );
      return {
        success: false,
        error: "Failed to verify profile status. Please try again.",
      };
    }

    if (existingProfile) {
      return {
        success: false,
        error: "An approved teacher profile already exists for this account.",
      };
    }

    // 3. Insert teacher profile
    const { error: insertError } = await supabase
      .from("teacher_profiles")
      .insert({
        user_id: user.id,
        school_id: schoolId,
        name: name.trim(),
        gender: gender,
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        village: village?.trim() || null,
        school_code: schoolCode.toUpperCase().trim(),
      });

    if (insertError) {
      authLogger.error(
        "[Save Profile] Failed to create teacher profile",
        insertError,
      );
      return {
        success: false,
        error: "Failed to create teacher profile. Please try again.",
      };
    }

    // 4. Update user app_metadata to include role using Admin API
    // This ensures the JWT reflects app_metadata.role = 'teacher' immediately
    try {
      const adminClient = await createAdminClient();
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(user.id, {
          app_metadata: {
            role: "teacher",
            school_id: schoolId,
            school_code: schoolCode.toUpperCase().trim(),
          },
        });

      if (updateError) {
        authLogger.error(
          "[Save Profile] Failed to update user metadata",
          updateError,
        );
        // Don't fail here - profile is already created
      }
    } catch (adminError) {
      authLogger.error("[Save Profile] Admin client error", adminError);
      // Don't fail - profile creation succeeded
    }

    return { success: true };
  } catch (error) {
    authLogger.error("[Save Profile] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Update existing teacher profile
 * Used in settings page to update profile details
 */
export async function updateTeacherProfile({
  name,
  gender,
  phone,
  subject,
  village,
}: UpdateTeacherProfileParams): Promise<SaveTeacherProfileResult> {
  try {
    // 1. Get current user
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // SECURITY: Rate limit onboarding operations to prevent abuse
    const updateAllowed = await checkTeacherOnboardRateLimit(user.id);
    if (!updateAllowed) {
      authLogger.warn("[updateTeacherProfile] Rate limit exceeded", {
        userId: user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    // 2. Validate required fields
    if (!name?.trim()) {
      return { success: false, error: "Name is required" };
    }

    if (!gender) {
      return { success: false, error: "Gender is required" };
    }

    // 3. Update teacher profile
    const { error: updateError } = await supabase
      .from("teacher_profiles")
      .update({
        name: name.trim(),
        gender: gender,
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        village: village?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      authLogger.error(
        "[Update Profile] Failed to update teacher profile",
        updateError,
      );
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }

    authLogger.success("[Update Profile] Teacher profile updated successfully");
    return { success: true };
  } catch (error) {
    authLogger.error("[Update Profile] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get current user's teacher profile
 */
export async function getTeacherProfile() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated", profile: null };
    }

    const supabase = await createClient();

    // Use .maybeSingle() for cleaner handling - returns null if no profile exists
    // OPTIMIZATION: Select only needed columns instead of *
    const { data: profile, error } = await supabase
      .from("teacher_profiles")
      .select(
        "user_id, name, phone, school_id, school_code, gender, subject, village, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      authLogger.error("[getTeacherProfile] Error fetching profile", error);
      return {
        success: false,
        error: "Failed to fetch profile",
        profile: null,
      };
    }

    return { success: true, profile };
  } catch (error) {
    authLogger.error("[getTeacherProfile] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      profile: null,
    };
  }
}
