"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createClient,
  verifyTeacherAuth,
  verifyClassOwnership,
} from "@/lib/supabase-server";
import { checkTeacherMutationRateLimit } from "@/lib/rate-limiter-distributed";
import {
  CreateClassSchema,
  UpdateClassSchema,
  ClassIdSchema,
} from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { handleZodError } from "@/lib/action-error-handler";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

/**
 * Class CRUD operations for teachers
 * Handles creation, updating, and deletion of classes
 */

export async function createClass(name: string, subject?: string) {
  try {
    // Validate input
    let validatedInput;
    try {
      validatedInput = CreateClassSchema.parse({ name, subject });
    } catch (error) {
      return handleZodError(error);
    }
    name = validatedInput.name;
    subject = validatedInput.subject;

    // SECURITY: Verify caller is authenticated and is a teacher
    const auth = await verifyTeacherAuth("createClass");
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit teacher mutations to prevent abuse
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name,
        subject: subject || null,
        teacher_id: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      authLogger.error("[createClass] Database error", { error: error.message });
      return { success: false, error: "Failed to create class. Please try again." };
    }

    revalidatePath("/app/teacher/classes");
    return { success: true, data };
  } catch (error) {
    authLogger.error("[createClass] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateClass(
  classId: string,
  name: string,
  subject?: string,
) {
  try {
    // Validate inputs
    let validatedInput;
    try {
      validatedInput = UpdateClassSchema.parse({ classId, name, subject });
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller is authenticated and owns this class
    const auth = await verifyClassOwnership(
      "updateClass",
      validatedInput.classId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit teacher mutations to prevent abuse
    const rateLimitAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!rateLimitAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("classes")
      .update({
        name: validatedInput.name,
        subject: validatedInput.subject || null,
      })
      .eq("id", validatedInput.classId)
      .select()
      .single();

    if (error) {
      authLogger.error("[updateClass] Database error", { error: error.message });
      return { success: false, error: "Failed to update class. Please try again." };
    }

    revalidatePath("/app/teacher/classes");
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    authLogger.error("[updateClass] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function deleteClass(classId: string) {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    // SECURITY: Verify caller is authenticated and owns this class
    const auth = await verifyClassOwnership("deleteClass", validatedClassId);
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit teacher mutations to prevent abuse
    const deletionAllowed = await checkTeacherMutationRateLimit(auth.user.id);
    if (!deletionAllowed) {
      authLogger.warn("[deleteClass] Rate limit exceeded", {
        userId: auth.user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", validatedClassId);

    if (error) {
      authLogger.error("[deleteClass] Database error", { error: error.message });
      return { success: false, error: "Failed to delete class. Please try again." };
    }

    revalidatePath("/app/teacher/classes");
    return { success: true };
  } catch (error) {
    authLogger.error("[deleteClass] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
