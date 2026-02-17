"use server";

import { createAdminClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import {
  SchoolCodeSchema,
  StaffPinSchema,
  TeacherNameSchema,
  PhoneSchema,
} from "@/lib/validation-schemas";
import {
  normalizeSchoolCode,
  handleZodValidationError,
  type VerifyTeacherParams,
  type VerifyTeacherResult,
  type SchoolData,
} from "./school-utils";

/**
 * Helper: Validate and parse input parameters
 */
function validateVerifyTeacherInput(
  schoolCode: string,
  staffPin: string,
  teacherName?: string,
  phone?: string,
):
  | {
      success: true;
      data: {
        schoolCode: string;
        staffPin: string;
        teacherName?: string;
        phone?: string;
      };
    }
  | { success: false; error: string } {
  try {
    const validatedSchoolCode = SchoolCodeSchema.parse(schoolCode);
    const validatedStaffPin = StaffPinSchema.parse(staffPin);
    const validatedTeacherName = teacherName
      ? TeacherNameSchema.parse(teacherName)
      : undefined;
    const validatedPhone = phone ? PhoneSchema.parse(phone) : undefined;

    return {
      success: true,
      data: {
        schoolCode: validatedSchoolCode,
        staffPin: validatedStaffPin,
        teacherName: validatedTeacherName,
        phone: validatedPhone,
      },
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

/**
 * Helper: Check if user can register as teacher
 */
async function canUserRegisterAsTeacher(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
): Promise<{ canRegister: true } | { canRegister: false; error: string }> {
  if (!user) {
    return { canRegister: false, error: "Not authenticated" };
  }

  const isAnonymous = user.is_anonymous || false;
  if (isAnonymous) {
    return {
      canRegister: false,
      error:
        "Anonymous users cannot register as teachers. Please sign in with email or phone.",
    };
  }

  const { data: existingTeacher, error: existingTeacherError } =
    await adminClient
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (existingTeacherError) {
    authLogger.error(
      "[verifyTeacher] Error checking existing teacher profile",
      existingTeacherError,
    );
  }

  if (existingTeacher) {
    return {
      canRegister: false,
      error: "You are already registered as a teacher",
    };
  }

  return { canRegister: true };
}

/**
 * Helper: Lookup school by code
 */
async function lookupSchoolByCode(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  schoolCode: string,
): Promise<
  { success: true; school: SchoolData } | { success: false; error: string }
> {
  const { data: school, error: schoolError } = await adminClient
    .from("schools")
    .select("id, school_code, school_name")
    .eq("school_code", normalizeSchoolCode(schoolCode))
    .maybeSingle();

  if (schoolError) {
    authLogger.error("[verifyTeacher] Error looking up school", schoolError);
    return {
      success: false,
      error: "Failed to lookup school. Please try again.",
    };
  }

  if (!school) {
    authLogger.debug("[verifyTeacher] School code not found", { schoolCode });
    return {
      success: false,
      error: "Invalid school code. Please verify and try again.",
    };
  }

  return { success: true, school };
}

/**
 * Helper: Verify staff PIN via RPC
 */
async function verifyStaffPinRPC(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  schoolId: string,
  staffPin: string,
): Promise<
  { success: true; pinMatch: boolean } | { success: false; error: string }
> {
  const { data: verifyResult, error: verifyError } = await adminClient.rpc(
    "verify_staff_pin",
    {
      p_school_id: schoolId,
      p_pin: staffPin,
    },
  );

  if (verifyError) {
    authLogger.error("[verifyTeacher] RPC error during PIN verification", {
      message: verifyError.message,
      code: verifyError.code,
      details: verifyError.details,
      hint: verifyError.hint,
    });
    return {
      success: false,
      error: "Unable to verify PIN. Please try again.",
    };
  }

  const pinMatch = verifyResult?.[0]
    ? Boolean(verifyResult[0].is_valid)
    : false;

  if (verifyResult?.[0]) {
    authLogger.debug("[verifyTeacher] PIN match result", {
      is_valid: verifyResult[0].is_valid,
      pinMatch,
    });
  } else {
    authLogger.warn("[verifyTeacher] No PIN record found for school", {
      schoolId,
    });
  }

  return { success: true, pinMatch };
}

/**
 * Helper: Create teacher profile and update user metadata
 */
async function createTeacherProfile(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  schoolId: string,
  schoolCode: string,
  teacherName: string,
  phone?: string,
  subject?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { error: insertError } = await adminClient
    .from("teacher_profiles")
    .insert({
      user_id: userId,
      school_id: schoolId,
      name: teacherName,
      phone,
      subject,
      school_code: schoolCode,
    });

  if (insertError) {
    authLogger.error(
      "[verifyTeacher] Failed to create teacher profile",
      insertError,
    );
    return {
      success: false,
      error: "Failed to create teacher profile. Please try again.",
    };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: "teacher",
        school_id: schoolId,
        school_code: schoolCode,
      },
    },
  );

  if (updateError) {
    authLogger.warn(
      "[verifyTeacher] Failed to update app_metadata (non-critical)",
      updateError,
    );
  }

  return { success: true };
}

/**
 * Verify teacher credentials and create profile
 * CRITICAL FIX: Reduced complexity from 23 to <15 by extracting helper functions
 */
export async function verifyTeacher({
  schoolCode,
  staffPin,
  teacherName,
  phone,
  subject,
}: VerifyTeacherParams): Promise<VerifyTeacherResult> {
  try {
    const inputValidation = validateVerifyTeacherInput(
      schoolCode,
      staffPin,
      teacherName,
      phone,
    );
    if (!inputValidation.success) {
      return inputValidation;
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = await createAdminClient();

    const registrationCheck = await canUserRegisterAsTeacher(user, adminClient);
    if (!registrationCheck.canRegister) {
      return { success: false, error: registrationCheck.error };
    }

    const isAllowed = await checkRateLimit(
      `verify-teacher:${user.id}`,
      RATE_LIMITS.teacherVerification,
    );
    if (!isAllowed) {
      authLogger.warn("[verifyTeacher] Rate limit exceeded for user", {
        userId: user.id,
      });
      return {
        success: false,
        error:
          "Too many verification attempts. Please wait an hour before trying again.",
      };
    }

    const schoolLookup = await lookupSchoolByCode(
      adminClient,
      inputValidation.data.schoolCode,
    );
    if (!schoolLookup.success) {
      return schoolLookup;
    }

    authLogger.debug("[verifyTeacher] School found", {
      schoolId: schoolLookup.school.id,
      schoolName: schoolLookup.school.school_name,
    });

    const pinVerification = await verifyStaffPinRPC(
      adminClient,
      schoolLookup.school.id,
      inputValidation.data.staffPin,
    );
    if (!pinVerification.success) {
      return pinVerification;
    }

    if (!pinVerification.pinMatch) {
      authLogger.warn("[verifyTeacher] Invalid PIN attempt", {
        schoolCode: inputValidation.data.schoolCode,
        schoolId: schoolLookup.school.id,
      });
      return {
        success: false,
        error: "Invalid PIN. Please verify and try again.",
      };
    }

    authLogger.info("[verifyTeacher] PIN verified successfully", {
      schoolId: schoolLookup.school.id,
    });

    if (inputValidation.data?.teacherName?.trim()) {
      const profileResult = await createTeacherProfile(
        adminClient,
        user.id,
        schoolLookup.school.id,
        schoolLookup.school.school_code,
        inputValidation.data.teacherName,
        inputValidation.data.phone,
        subject,
      );
      if (!profileResult.success) {
        return profileResult;
      }
    }

    return {
      success: true,
      schoolId: schoolLookup.school.id,
      schoolName: schoolLookup.school.school_name,
    };
  } catch (error) {
    authLogger.error("[verifyTeacher] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
