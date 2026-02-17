"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { authLogger } from "@/lib/auth-logger";
import { findAuthUserByEmail } from "@/lib/admin-utils";
import { AuthEmailSchema } from "@/lib/validation-schemas";

/**
 * Authentication verification and role management
 * Handles user existence checks, role verification, and session management
 */

/**
 * Check if email exists in the system and determine role
 *
 * Role hierarchy:
 * - Student: Can only be student (cannot become teacher/admin)
 * - Teacher: Can be teacher, can be promoted to admin
 * - Admin: Teacher with admin privileges
 * - Super Admin: Only Atal AI (system account)
 *
 * Rules:
 * - Student email cannot be used for teacher/admin signup
 * - Teacher email cannot be used for student signup
 * - Existing auth users must login, not create new account
 */
export async function checkEmailExistsInAuth(email: string): Promise<{
  exists: boolean;
  role?: "student" | "teacher" | "admin" | "super_admin" | "unknown";
  hasStudentProfile?: boolean;
  hasTeacherProfile?: boolean;
}> {
  try {
    // Validate and normalize email
    const trimmedEmail = AuthEmailSchema.parse(email);

    // Use admin client to check auth.users (bypasses RLS)
    const adminClient = await createAdminClient();

    // Check if user exists in Supabase auth (with pagination support)
    const existingAuthUser = await findAuthUserByEmail(
      adminClient,
      trimmedEmail,
    );

    if (!existingAuthUser) {
      authLogger.debug(
        "[checkEmailExistsInAuth] Email not found in auth.users",
      );
      return { exists: false };
    }

    // User exists in auth - check their profiles
    const userId = existingAuthUser.id;

    // Check student_profiles
    const { data: studentProfile } = await adminClient
      .from("student_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Check teacher_profiles
    const { data: teacherProfile } = await adminClient
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    const hasStudentProfile = studentProfile !== null;
    const hasTeacherProfile = teacherProfile !== null;

    // Determine role based on profiles and app_metadata
    let role: "student" | "teacher" | "admin" | "super_admin" | "unknown" =
      "unknown";
    const appRole = existingAuthUser.app_metadata?.role;

    if (appRole === "super_admin") {
      role = "super_admin";
    } else if (appRole === "admin") {
      role = "admin";
    } else if (hasTeacherProfile || appRole === "teacher") {
      role = "teacher";
    } else if (hasStudentProfile) {
      role = "student";
    }

    authLogger.info("[checkEmailExistsInAuth] Email exists", {
      role,
      hasStudentProfile,
      hasTeacherProfile,
      appRole,
    });

    return {
      exists: true,
      role,
      hasStudentProfile,
      hasTeacherProfile,
    };
  } catch (error) {
    authLogger.error("[checkEmailExistsInAuth] Unexpected error", error);
    return { exists: false };
  }
}

/**
 * Check if current user is a teacher
 * Returns isTeacher status and user ID
 */
export async function checkUserIsTeacher(): Promise<{
  isTeacher: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { getCurrentUser } = await import("@/lib/supabase-server");
    const user = await getCurrentUser();

    if (!user) {
      return { isTeacher: false, error: "Not authenticated" };
    }

    const supabase = await createClient();

    // Check if user has a teacher profile
    const { data: teacherProfile, error } = await supabase
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      authLogger.error(
        "[checkUserIsTeacher] Error checking teacher profile",
        error,
      );
      return {
        isTeacher: false,
        userId: user.id,
        error: "Failed to check teacher status",
      };
    }

    return {
      isTeacher: teacherProfile !== null,
      userId: user.id,
    };
  } catch (error) {
    authLogger.error("[checkUserIsTeacher] Unexpected error", error);
    return { isTeacher: false, error: "An unexpected error occurred" };
  }
}

/**
 * Sign out the current user
 * Used when user tries to login via wrong role page
 */
export async function signOutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      authLogger.error("[signOutUser] Sign out failed", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    authLogger.error("[signOutUser] Unexpected error", error);
    return { success: false, error: "Failed to sign out" };
  }
}
