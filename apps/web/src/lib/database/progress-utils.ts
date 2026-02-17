/**
 * Progress Database Utilities
 *
 * Shared helpers for updating student progress and recording points.
 * Uses atomic RPC calls to prevent score regression (BUG-016).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { authLogger } from "@/lib/auth-logger";

/**
 * Update student knowledge state atomically.
 * Uses GREATEST() to keep highest score and increments attempts correctly.
 *
 * @returns Object with optional error
 */
export async function updateProgressAtomically(
  supabase: SupabaseClient,
  userId: string,
  moduleId: string,
  topicId: string,
  score: number,
): Promise<{ error: Error | null }> {
  // Validate score before sending to database
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    authLogger.warn("[progress] Invalid score value:", { score, userId, topicId });
    return { error: new Error(`Invalid score: ${score}`) };
  }

  const { error } = await supabase.rpc("update_progress_atomic", {
    p_student_id: userId,
    p_module_id: moduleId,
    p_topic_id: topicId,
    p_score: score,
  });

  if (error) {
    authLogger.error("[progress] Atomic update failed:", {
      error: error.message,
      userId,
      moduleId,
      topicId,
    });
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Record points in the points_history table.
 *
 * @returns Object with optional error
 */
export async function recordPoints(
  supabase: SupabaseClient,
  userId: string,
  points: number,
  source: string,
  description: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("points_history").insert({
    student_id: userId,
    points,
    source,
    description,
  });

  if (error) {
    authLogger.warn("[progress] Failed to record points:", {
      error: error.message,
      userId,
    });
    return { error: new Error(error.message) };
  }

  return { error: null };
}
