"use server";

import {
  createClient,
  createAdminClient,
  getCurrentUser,
} from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { SchoolCodeSchema, StaffPinSchema } from "@/lib/validation-schemas";
import {
  normalizeSchoolCode,
  handleZodValidationError,
  type SchoolData,
} from "./school-utils";

/**
 * Helper: Validate PIN input
 */
function validatePinInput(
  newPin: string,
): { valid: true } | { valid: false; error: string } {
  if (!newPin || newPin.length < 4) {
    return {
      valid: false,
      error: "PIN must be at least 4 characters long",
    };
  }
  return { valid: true };
}

/**
 * Helper: Check if user is authorized to rotate PINs
 */
async function checkPinRotationAuthorization(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<
  | {
      authorized: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      userRole: string | undefined;
    }
  | { authorized: false; error: string }
> {
  if (!user) {
    authLogger.warn("[rotateStaffPin] Unauthenticated access attempt");
    return { authorized: false, error: "Not authenticated" };
  }

  const userRole = user.app_metadata?.role;
  let isAuthorized =
    userRole === "admin" ||
    userRole === "super_admin" ||
    userRole === "teacher";

  if (!isAuthorized && !userRole) {
    const { data: teacherProfile, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("user_id, school_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      authLogger.error(
        "[rotateStaffPin] Error checking teacher profile",
        profileError,
      );
      return { authorized: false, error: "Failed to verify authorization" };
    }

    isAuthorized = teacherProfile !== null;
  }

  if (!isAuthorized) {
    authLogger.warn("[rotateStaffPin] Unauthorized role access attempt", {
      userId: user.id,
      role: userRole,
    });
    return {
      authorized: false,
      error: "Unauthorized: Teacher or Admin access required",
    };
  }

  return { authorized: true, user, userRole };
}

/**
 * Helper: Check if user is authorized for specific school
 */
async function checkSchoolAuthorization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  schoolId: string,
  userRole: string | undefined,
): Promise<{ authorized: true } | { authorized: false; error: string }> {
  if (userRole === "admin" || userRole === "super_admin") {
    return { authorized: true };
  }

  const { data: teacherProfile, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError) {
    authLogger.error(
      "[rotateStaffPin] Error checking teacher school authorization",
      teacherError,
    );
    return {
      authorized: false,
      error: "Failed to verify school authorization",
    };
  }

  const isAuthorizedForSchool = teacherProfile?.school_id === schoolId;
  if (!isAuthorizedForSchool) {
    authLogger.warn("[rotateStaffPin] User not authorized for school", {
      userId: user.id,
      schoolId,
    });
    return {
      authorized: false,
      error: "Unauthorized: You can only rotate PINs for your own school.",
    };
  }

  return { authorized: true };
}

/**
 * Helper: Lookup school and verify authorization
 */
async function lookupSchoolAndVerifyAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  schoolCode: string,
  userRole: string | undefined,
): Promise<
  { success: true; school: SchoolData } | { success: false; error: string }
> {
  const { data: schoolData, error: schoolError } = await supabase
    .from("schools")
    .select("id, school_code, school_name")
    .eq("school_code", normalizeSchoolCode(schoolCode))
    .maybeSingle();

  if (schoolError) {
    authLogger.error("[rotateStaffPin] Error looking up school", schoolError);
    return { success: false, error: "Failed to lookup school" };
  }

  if (!schoolData) {
    authLogger.warn("[rotateStaffPin] School code not found or not provided", {
      schoolCode,
    });
    return {
      success: false,
      error:
        "Unable to rotate PIN. Please verify your school code and try again.",
    };
  }

  const authCheck = await checkSchoolAuthorization(
    supabase,
    user,
    schoolData.id,
    userRole,
  );
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  return { success: true, school: schoolData };
}

/**
 * Helper: Call RPC to rotate PIN
 */
async function rotatePinViaRPC(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  schoolId: string,
  newPin: string,
): Promise<
  { success: true; rotatedAt: string } | { success: false; error: string }
> {
  const { data: rotateResult, error: rotateError } = await adminClient.rpc(
    "rotate_staff_pin",
    {
      p_school_id: schoolId,
      p_new_pin: newPin,
    },
  );

  if (rotateError) {
    authLogger.error(
      "[rotateStaffPin] Failed to rotate PIN via RPC",
      rotateError,
    );
    return {
      success: false,
      error: "Failed to rotate PIN. Please try again.",
    };
  }

  if (!rotateResult?.[0]?.success) {
    const errorMsg = rotateResult?.[0]?.error_message || "Failed to rotate PIN";
    authLogger.error("[rotateStaffPin] RPC rotation failed", {
      error: errorMsg,
    });
    return {
      success: false,
      error: errorMsg,
    };
  }

  return {
    success: true,
    rotatedAt: new Date().toISOString(),
  };
}

/**
 * Rotate Staff PIN for a school
 * CRITICAL FIX: Reduced complexity from 24 to <15 by extracting helper functions
 *
 * @param schoolCode - The school code (e.g., "14H0182")
 * @param newPin - The new staff PIN (will be hashed)
 * @returns Success status with rotation timestamp
 */
export async function rotateStaffPin(schoolCode: string, newPin: string) {
  try {
    const validatedSchoolCode = SchoolCodeSchema.parse(schoolCode);
    const validatedNewPin = StaffPinSchema.parse(newPin);

    const pinValidation = validatePinInput(validatedNewPin);
    if (!pinValidation.valid) {
      return { success: false, error: pinValidation.error };
    }

    const user = await getCurrentUser();
    const supabase = await createClient();

    const authCheck = await checkPinRotationAuthorization(user, supabase);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const schoolLookup = await lookupSchoolAndVerifyAuth(
      supabase,
      authCheck.user,
      validatedSchoolCode,
      authCheck.userRole,
    );
    if (!schoolLookup.success) {
      return schoolLookup;
    }

    const adminClient = await createAdminClient();
    const rotateResult = await rotatePinViaRPC(
      adminClient,
      schoolLookup.school.id,
      validatedNewPin,
    );
    if (!rotateResult.success) {
      return rotateResult;
    }

    authLogger.success("[rotateStaffPin] PIN rotated successfully", {
      schoolId: schoolLookup.school.id,
    });
    return {
      success: true,
      schoolCode: schoolLookup.school.school_code,
      schoolName: schoolLookup.school.school_name,
      rotatedAt: rotateResult.rotatedAt,
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

