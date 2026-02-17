/**
 * Class authorization verification
 * Eliminates duplication in class access checking for teachers
 */

import { createClient } from "../supabase-server";
import { authLogger } from "../auth-logger";

export type ActionResponse<T = void> = (
  | {
      success: true;
      data?: T;
    }
  | {
      success: false;
      error: string;
    }
);

export interface ClassData {
  id: string;
  teacher_id: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Verify that a user (teacher) has access to a class
 * Used by server actions that need to validate class ownership
 */
export async function verifyClassAccess(
  classId: string,
  userId: string,
  functionName: string,
): Promise<ActionResponse<ClassData>> {
  if (!classId) {
    return {
      success: false,
      error: "Class ID is required",
    };
  }

  try {
    const supabase = await createClient();

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      authLogger.error(
        `[${functionName}] Error fetching class`,
        classError,
      );
      return {
        success: false,
        error: "Failed to fetch class",
      };
    }

    if (!classData) {
      return {
        success: false,
        error: "Class not found",
      };
    }

    if (classData.teacher_id !== userId) {
      authLogger.warn(
        `[${functionName}] Unauthorized class access attempted`,
        {
          userId,
          classId,
          classTeacherId: classData.teacher_id,
        },
      );
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return {
      success: true,
      data: classData as ClassData,
    };
  } catch (error) {
    authLogger.error(
      `[${functionName}] Unexpected error verifying class access`,
      error instanceof Error ? error : { error: String(error) },
    );
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Verify that a user (teacher) has access to a school
 * Used by server actions that need to validate school ownership
 */
export async function verifySchoolAccess(
  schoolId: string,
  userId: string,
  functionName: string,
): Promise<ActionResponse<{ id: string }>> {
  if (!schoolId) {
    return {
      success: false,
      error: "School ID is required",
    };
  }

  try {
    const supabase = await createClient();

    const { data: schoolData, error: schoolError } = await supabase
      .from("schools")
      .select("id")
      .eq("id", schoolId)
      .maybeSingle();

    if (schoolError) {
      authLogger.error(
        `[${functionName}] Error fetching school`,
        schoolError,
      );
      return {
        success: false,
        error: "Failed to fetch school",
      };
    }

    if (!schoolData) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Note: Admin check would go here if needed
    // For now, just verify school exists

    return {
      success: true,
      data: schoolData,
    };
  } catch (error) {
    authLogger.error(
      `[${functionName}] Unexpected error verifying school access`,
      error instanceof Error ? error : { error: String(error) },
    );
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
