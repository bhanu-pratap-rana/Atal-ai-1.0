"use server";

import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import {
  createClient,
  getCurrentUser,
  verifyStudentAuth,
} from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import {
  checkRateLimit,
  checkStudentMutationRateLimit,
} from "@/lib/rate-limiter-distributed";
import { queryCache } from "@/lib/cache/query-cache";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import {
  JoinClassSchema,
  StudentProfileSchema,
  ClassIdSchema,
} from "@/lib/validation-schemas";
import type { UpsertStudentProfileRPCResponse } from "@/types/auth";
import { handleZodError } from "@/lib/action-error-handler";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

interface StudentProfileParams {
  name: string;
  gender: "male" | "female";
  phone?: string;
  rollNumber?: string;
  schoolName?: string;
  className?: string;
  village?: string;
}

/**
 * Save student profile after signup
 * Creates a new record in student_profiles table
 */
export async function saveStudentProfile(params: StudentProfileParams) {
  try {
    // Validate inputs
    let validatedInput;
    try {
      validatedInput = StudentProfileSchema.parse(params);
    } catch (error) {
      return handleZodError(error);
    }
    authLogger.debug("[saveStudentProfile] Validated input", {
      name: validatedInput.name,
      gender: validatedInput.gender,
    });

    // SECURITY: Verify caller is authenticated and is a student (not teacher/admin)
    const auth = await verifyStudentAuth("saveStudentProfile");
    if (!auth.authorized) {
      return auth.error;
    }

    const user = auth.user;

    authLogger.debug("[saveStudentProfile] User authenticated", {
      userId: user.id,
      email: user.email,
      isAnonymous: user.is_anonymous,
    });

    // SECURITY: Rate limit student mutations to prevent abuse
    const saveAllowed = await checkStudentMutationRateLimit(user.id);
    if (!saveAllowed) {
      authLogger.warn("[saveStudentProfile] Rate limit exceeded", {
        userId: user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    // SECURITY FIX #2: Use atomic UPSERT RPC to eliminate race condition
    // Single database operation ensures concurrent requests are serialized atomically
    // No check-then-insert pattern window for concurrent requests to exploit
    authLogger.debug(
      "[saveStudentProfile] Calling atomic upsert_student_profile RPC...",
      {
        userId: user.id,
        name: validatedInput.name,
      },
    );

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "upsert_student_profile",
      {
        p_user_id: user.id,
        p_name: validatedInput.name,
        p_gender: validatedInput.gender,
        p_date_of_birth: null, // Not in current schema - reserved for future
        p_phone: validatedInput.phone || null,
        p_location: validatedInput.village || null,
        p_medium: null, // Not in current schema - reserved for future
        p_board: null, // Not in current schema - reserved for future
        p_class: validatedInput.className || null,
      },
    );

    if (rpcError) {
      authLogger.error(
        "[saveStudentProfile] RPC upsert_student_profile failed",
        {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          userId: user.id,
        },
      );
      return {
        success: false,
        error: "Failed to save profile. Please try again.",
      };
    }

    // RPC returns JSON object with success/error
    const rpcResponse = rpcResult as UpsertStudentProfileRPCResponse;
    if (rpcResponse && typeof rpcResponse === "object") {
      if (!rpcResponse.success) {
        authLogger.error("[saveStudentProfile] RPC returned error", {
          error: rpcResponse.error,
          code: rpcResponse.code,
        });
        return {
          success: false,
          error: "Failed to save profile. Please try again.",
        };
      }
    }

    authLogger.success(
      "[saveStudentProfile] Profile saved successfully (UPSERT)",
      {
        userId: user.id,
        result: rpcResult,
      },
    );
    revalidatePath("/app/dashboard");
    return { success: true };
  } catch (error) {
    authLogger.error("[saveStudentProfile] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Internal function to fetch student profile from database
 * This is wrapped by getStudentProfile() with query caching
 */
async function fetchStudentProfileFromDB(userId: string) {
  const supabase = await createClient();

  // Use maybeSingle to avoid 406 error when profile doesn't exist
  // OPTIMIZATION: Select only needed columns instead of *
  const { data: profile, error } = await supabase
    .from("student_profiles")
    .select(
      "user_id, name, gender, phone, roll_number, school_id, school_name, class_name, village, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}

/**
 * Get current user's student profile
 * PERFORMANCE: Results cached for 2 minutes to reduce database load
 */
export async function getStudentProfile() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated", profile: null };
    }

    // PERFORMANCE: Use query cache - 2 minute TTL for student profiles
    // Student profiles change less frequently and benefit from caching
    const profile = await queryCache.getOrFetch(
      `student:${user.id}:profile`,
      () => fetchStudentProfileFromDB(user.id),
      2 * 60 * 1000, // 2 minutes
    );

    return { success: true, profile };
  } catch (error) {
    authLogger.error("[getStudentProfile] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      profile: null,
    };
  }
}

/**
 * Preview class details before joining
 * Returns class name, teacher name, and subject without requiring PIN
 * This allows students to verify they're joining the right class
 */
export async function previewClass(classCode: string): Promise<{
  success: boolean;
  data?: {
    className: string;
    teacherName: string;
    subject: string | null;
    studentCount: number;
  };
  error?: string;
}> {
  try {
    // Validate input using schema (consistent with other functions)
    let validatedClassCode;
    try {
      validatedClassCode = JoinClassSchema.pick({ classCode: true }).parse({
        classCode: classCode.toUpperCase().replaceAll(/[^A-Z0-9]/g, ""),
      }).classCode;
    } catch (error) {
      const zodError = handleZodError(error);
      return { success: zodError.success, error: zodError.error };
    }

    // Use regular client - RLS policy allows authenticated users to preview classes by code
    const supabase = await createClient();

    // Find class by code (no PIN required for preview)
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(
        `
        id,
        name,
        subject,
        teacher_id
      `,
      )
      .eq("class_code", validatedClassCode)
      .maybeSingle();

    if (classError) {
      authLogger.error("[previewClass] Error looking up class", classError);
      return { success: false, error: "Failed to lookup class" };
    }

    if (!classData) {
      return {
        success: false,
        error: "Class not found. Please check the code.",
      };
    }

    // Get teacher name
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("name")
      .eq("user_id", classData.teacher_id)
      .maybeSingle();

    // Get student count
    const { count: studentCount } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classData.id);

    return {
      success: true,
      data: {
        className: classData.name,
        teacherName: teacherProfile?.name || "Unknown Teacher",
        subject: classData.subject,
        studentCount: studentCount || 0,
      },
    };
  } catch (error) {
    authLogger.error("[previewClass] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

interface JoinClassParams {
  classCode: string;
  pin: string;
}

/**
 * Helper: Verify PIN using constant-time comparison
 */
function verifyPin(pin: string, storedPin: string | null): boolean {
  if (!storedPin) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(pin), Buffer.from(storedPin));
  } catch (error) {
    authLogger.error(
      "[Student] PIN verification failed",
      error instanceof Error ? error : { error: String(error) },
    );
    return false;
  }
}

/**
 * Helper: Lookup class by code
 * Uses regular client - RLS policy allows authenticated users to preview classes by code
 */
async function lookupClassByCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classCode: string,
): Promise<
  | {
      success: true;
      classData: {
        id: string;
        name: string;
        class_code: string;
        join_pin: string | null;
      };
    }
  | { success: false; error: string }
> {
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, class_code, join_pin")
    .eq("class_code", classCode)
    .maybeSingle();

  if (classError) {
    authLogger.error("[joinClass] Error looking up class", classError);
    return { success: false, error: "Failed to lookup class" };
  }

  if (!classData) {
    authLogger.debug("[joinClass] Class not found", { classCode });
    return { success: false, error: "Invalid class code or PIN" };
  }

  return { success: true, classData };
}

/**
 * Helper: Check if student is already enrolled
 */
async function checkExistingEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
  studentId: string,
): Promise<{ enrolled: true } | { enrolled: false; error?: string }> {
  const { data: existingEnrollment, error: enrollmentCheckError } =
    await supabase
      .from("enrollments")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .maybeSingle();

  if (enrollmentCheckError) {
    authLogger.error(
      "[joinClass] Error checking existing enrollment",
      enrollmentCheckError,
    );
    return { enrolled: false, error: "Failed to check enrollment status" };
  }

  if (existingEnrollment) {
    return { enrolled: true };
  }

  return { enrolled: false };
}

/**
 * Helper: Create enrollment
 */
async function createEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
  studentId: string,
  className: string,
): Promise<
  | { success: true; data: { className: string; [key: string]: unknown } }
  | { success: false; error: string }
> {
  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      class_id: classId,
      student_id: studentId,
    })
    .select()
    .single();

  if (error) {
    authLogger.error("[joinClass] Failed to create enrollment", {
      code: error.code,
      message: error.message,
      details: error.details,
      classId,
      studentId,
    });

    if (error.code === "23505") {
      return { success: false, error: "Already enrolled in this class" };
    }

    return {
      success: false,
      error: "Failed to enroll in class. Please try again.",
    };
  }

  return {
    success: true,
    data: {
      ...data,
      className,
    },
  };
}

/**
 * Join a class using class code and PIN (refactored to reduce cognitive complexity)
 * CRITICAL FIX: Reduced complexity from 16 to <15 by extracting helper functions
 */
export async function joinClass({ classCode, pin }: JoinClassParams) {
  try {
    let validatedInput;
    try {
      validatedInput = JoinClassSchema.parse({ classCode, pin });
    } catch (error) {
      return handleZodError(error);
    }
    const validatedClassCode = validatedInput.classCode;
    const validatedPin = validatedInput.pin;

    const auth = await verifyStudentAuth("joinClass");
    if (!auth.authorized) {
      return auth.error;
    }

    const isAllowed = await checkRateLimit(
      `join-class:${auth.user.id}:${validatedClassCode}`,
      RATE_LIMITS.classJoinAttempts,
    );
    if (!isAllowed) {
      authLogger.warn("[joinClass] Rate limit exceeded", {
        userId: auth.user.id,
        classCode: validatedClassCode,
      });
      return {
        success: false,
        error: "Too many join attempts. Please wait before trying again.",
      };
    }

    const supabase = await createClient();
    // Use regular client - RLS policy allows authenticated users to preview classes by code
    const classLookup = await lookupClassByCode(supabase, validatedClassCode);
    if (!classLookup.success) {
      return { success: false, error: classLookup.error };
    }

    const pinValid = verifyPin(validatedPin, classLookup.classData.join_pin);
    if (!pinValid) {
      authLogger.warn("[joinClass] Invalid PIN attempt", {
        classCode: validatedClassCode,
        userId: auth.user.id,
      });
      return { success: false, error: "Invalid class code or PIN" };
    }

    const enrollmentCheck = await checkExistingEnrollment(
      supabase,
      classLookup.classData.id,
      auth.user.id,
    );
    if (enrollmentCheck.enrolled) {
      return { success: false, error: "Already enrolled in this class" };
    }
    if (enrollmentCheck.error) {
      return { success: false, error: enrollmentCheck.error };
    }

    const enrollmentResult = await createEnrollment(
      supabase,
      classLookup.classData.id,
      auth.user.id,
      classLookup.classData.name,
    );

    if (enrollmentResult.success) {
      revalidatePath("/app/student/classes");
    }

    return enrollmentResult;
  } catch (error) {
    authLogger.error("[joinClass] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function leaveClass(classId: string) {
  try {
    // Validate class ID
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller is authenticated and is a student
    const auth = await verifyStudentAuth("leaveClass");
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit student mutations to prevent abuse
    const leaveAllowed = await checkStudentMutationRateLimit(auth.user.id);
    if (!leaveAllowed) {
      authLogger.warn("[leaveClass] Rate limit exceeded", {
        userId: auth.user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("class_id", validatedClassId)
      .eq("student_id", auth.user.id);

    if (error) {
      authLogger.error("[leaveClass] Database error", { error: error.message });
      return { success: false, error: "Failed to leave class. Please try again." };
    }

    revalidatePath("/app/student/classes");
    return { success: true };
  } catch (error) {
    authLogger.error("[leaveClass] Unexpected error", error instanceof Error ? error : { error: String(error) });
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
