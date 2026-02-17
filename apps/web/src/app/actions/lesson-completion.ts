"use server";

/**
 * Lesson Completion Server Action
 *
 * Handles lesson completion with proper cache invalidation.
 * Uses atomic database function to prevent race conditions.
 *
 * ROOT CAUSE FIX: Replaces client-side mutation + timestamp cache-busting
 * with proper server action + revalidatePath() pattern.
 */

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";

export interface LessonCompletionResult {
  success: boolean;
  masteryScore?: number;
  status?: "not_started" | "in_progress" | "mastered";
  attempts?: number;
  error?: string;
}

/**
 * Complete a lesson and update progress atomically.
 * Uses database RPC function to prevent race conditions.
 *
 * @param moduleId - Module identifier (e.g., "M1")
 * @param topicId - Topic identifier (e.g., "T1.1")
 * @param score - Calculated mastery score (0-100)
 * @returns Completion result with updated progress
 */
export async function completeLessonAndUpdateProgress(
  moduleId: string,
  topicId: string,
  score: number,
): Promise<LessonCompletionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const isAllowed = await checkRateLimit(`lesson-completion:${user.id}`, RATE_LIMITS.lessonCompletion);
    if (!isAllowed) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    // Validate inputs
    if (!moduleId || !topicId) {
      return { success: false, error: "Missing module or topic ID" };
    }

    if (score < 0 || score > 100) {
      return { success: false, error: "Invalid score value" };
    }

    const supabase = await createClient();

    authLogger.debug("[completeLessonAndUpdateProgress] Updating progress", {
      userId: user.id,
      moduleId,
      topicId,
      score,
    });

    // Use atomic RPC function to prevent race conditions
    const { data, error } = await supabase.rpc("update_progress_atomic", {
      p_student_id: user.id,
      p_module_id: moduleId,
      p_topic_id: topicId,
      p_score: score,
    });

    if (error) {
      authLogger.error("[completeLessonAndUpdateProgress] RPC error", {
        error: error.message,
        code: error.code,
      });
      return { success: false, error: "Failed to update progress" };
    }

    // Check RPC result
    if (!data?.success) {
      authLogger.error("[completeLessonAndUpdateProgress] RPC returned failure", {
        error: data?.error,
      });
      return { success: false, error: data?.error || "Database update failed" };
    }

    authLogger.success("[completeLessonAndUpdateProgress] Progress updated", {
      userId: user.id,
      moduleId,
      topicId,
      score: data.mastery_score,
      status: data.status,
      attempts: data.attempts,
    });

    // PROPER CACHE INVALIDATION - invalidate all related paths
    revalidatePath(`/app/learn/${moduleId}`);
    revalidatePath("/app/learn");
    revalidatePath("/app/dashboard");

    return {
      success: true,
      masteryScore: data.mastery_score,
      status: data.status,
      attempts: data.attempts,
    };
  } catch (error) {
    authLogger.error(
      "[completeLessonAndUpdateProgress] Unexpected error",
      error instanceof Error ? error : { error: String(error) },
    );
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Note: calculateMasteryScore and isPassingScore functions are exported from
// @/lib/constants/thresholds to avoid "use server" async function requirement
