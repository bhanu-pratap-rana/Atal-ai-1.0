"use server";

import { revalidatePath } from "next/cache";
import { createClient, verifyClassOwnership } from "@/lib/supabase-server";
import { checkTeacherMutationRateLimit } from "@/lib/rate-limiter-distributed";
import { authLogger } from "@/lib/auth-logger";
import { handleZodError } from "@/lib/action-error-handler";
import { EnrollmentSchema } from "@/lib/validation-schemas";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

/**
 * Student enrollment management for teacher classes
 * Handles enrolling and removing students from classes
 */

export async function enrollStudent(classId: string, studentId: string) {
  try {
    // Validate inputs
    let validatedInput;
    try {
      validatedInput = EnrollmentSchema.parse({ classId, studentId });
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller is authenticated and owns this class
    const auth = await verifyClassOwnership(
      "enrollStudent",
      validatedInput.classId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit teacher mutations to prevent abuse
    const enrollmentAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!enrollmentAllowed) {
      authLogger.warn("[enrollStudent] Rate limit exceeded", {
        userId: auth.user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        class_id: validatedInput.classId,
        student_id: validatedInput.studentId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return { success: false, error: "Student is already enrolled" };
      }
      authLogger.error("[enrollStudent] Database error", { error: error.message });
      return { success: false, error: "Failed to enroll student. Please try again." };
    }

    revalidatePath(`/app/teacher/classes/${validatedInput.classId}`);
    return { success: true, data };
  } catch (error) {
    authLogger.error("[enrollStudent] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function removeStudent(classId: string, studentId: string) {
  try {
    // Validate inputs
    let validatedInput;
    try {
      validatedInput = EnrollmentSchema.parse({ classId, studentId });
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller is authenticated and owns this class
    const auth = await verifyClassOwnership(
      "removeStudent",
      validatedInput.classId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit teacher mutations to prevent abuse
    const removalAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!removalAllowed) {
      authLogger.warn("[removeStudent] Rate limit exceeded", {
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
      .eq("class_id", validatedInput.classId)
      .eq("student_id", validatedInput.studentId);

    if (error) {
      authLogger.error("[removeStudent] Database error", { error: error.message });
      return { success: false, error: "Failed to remove student. Please try again." };
    }

    revalidatePath(`/app/teacher/classes/${validatedInput.classId}`);
    return { success: true };
  } catch (error) {
    authLogger.error("[removeStudent] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
