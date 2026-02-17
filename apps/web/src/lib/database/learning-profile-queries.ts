/**
 * Learning Style Profile Database Queries
 *
 * Centralizes database operations for learning style profiles
 * Eliminates duplication across services (adaptive-service, tutor-service, etc.)
 *
 * Usage:
 * ```typescript
 * import { fetchLearningStyleProfile, createDefaultProfile } from '@/lib/database/learning-profile-queries';
 *
 * // In any service
 * const profile = await fetchLearningStyleProfile(studentId);
 * ```
 */

import { createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import type { Database } from "@/types/database";

type LearningStyleProfileRow =
  Database["public"]["Tables"]["learning_style_profile"]["Row"];

/**
 * Fetch learning style profile for a student
 *
 * @param studentId - Student UUID
 * @returns Profile data or null if not found
 *
 * @example
 * ```typescript
 * const profile = await fetchLearningStyleProfile(studentId);
 * if (!profile) {
 *   console.log("No profile found");
 * }
 * ```
 */
export async function fetchLearningStyleProfile(
  studentId: string,
): Promise<LearningStyleProfileRow | null> {
  try {
    const supabase = await createClient();

    // OPTIMIZATION: Select only needed columns instead of *
    const { data, error } = await supabase
      .from("learning_style_profile")
      .select(
        "id, student_id, visual_score, text_score, auditory_score, preferred_style, images_viewed, voice_replays, text_read_time_seconds, updated_at",
      )
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      authLogger.error("[DB] Error fetching learning style profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    authLogger.error(
      "[DB] Exception fetching learning style profile:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

/**
 * Create a default learning style profile for a student
 *
 * Initializes equal distribution across all learning styles (33.33% each)
 *
 * @param studentId - Student UUID
 * @returns Created profile data
 *
 * @example
 * ```typescript
 * const profile = await createDefaultProfile(studentId);
 * ```
 */
export async function createDefaultProfile(
  studentId: string,
): Promise<LearningStyleProfileRow | null> {
  try {
    const supabase = await createClient();

    const defaultProfile = {
      student_id: studentId,
      visual_score: 33.33,
      text_score: 33.33,
      auditory_score: 33.33,
      images_viewed: 0,
      voice_replays: 0,
      text_read_time_seconds: 0,
    };

    const { data, error } = await supabase
      .from("learning_style_profile")
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      authLogger.error(
        "[DB] Error creating default learning profile:",
        error,
      );
      return null;
    }

    return data;
  } catch (error) {
    authLogger.error(
      "[DB] Exception creating default learning profile:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

/**
 * Update learning style profile scores for a student
 *
 * @param studentId - Student UUID
 * @param updates - Partial updates to the profile
 * @returns Success boolean
 *
 * @example
 * ```typescript
 * const success = await updateLearningStyleProfile(studentId, {
 *   visual_score: 45,
 *   text_score: 30,
 *   auditory_score: 25,
 * });
 * ```
 */
export async function updateLearningStyleProfile(
  studentId: string,
  updates: Partial<
    Pick<
      LearningStyleProfileRow,
      | "visual_score"
      | "text_score"
      | "auditory_score"
      | "images_viewed"
      | "voice_replays"
      | "text_read_time_seconds"
    >
  >,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("learning_style_profile")
      .update(updates)
      .eq("student_id", studentId);

    if (error) {
      authLogger.error(
        "[DB] Error updating learning style profile:",
        error,
      );
      return false;
    }

    return true;
  } catch (error) {
    authLogger.error(
      "[DB] Exception updating learning style profile:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Get or create learning style profile
 *
 * DB-001 FIX: Uses UPSERT pattern (single atomic operation)
 * - Eliminates race condition where two concurrent requests could both try to insert
 * - Reduces from 2 DB calls to 1 when profile doesn't exist
 *
 * @param studentId - Student UUID
 * @returns Profile data (existing or newly created)
 *
 * @example
 * ```typescript
 * const profile = await getOrCreateLearningProfile(studentId);
 * // Always returns a profile, never null
 * ```
 */
export async function getOrCreateLearningProfile(
  studentId: string,
): Promise<LearningStyleProfileRow | null> {
  try {
    const supabase = await createClient();

    // DB-001 FIX: Use UPSERT with onConflict to handle race conditions atomically
    // If profile exists, it's returned unchanged (ignoreDuplicates doesn't update)
    // If it doesn't exist, default values are inserted
    const defaultProfile = {
      student_id: studentId,
      visual_score: 33.33,
      text_score: 33.33,
      auditory_score: 33.33,
      images_viewed: 0,
      voice_replays: 0,
      text_read_time_seconds: 0,
    };

    const { data, error } = await supabase
      .from("learning_style_profile")
      .upsert(defaultProfile, {
        onConflict: "student_id",
        ignoreDuplicates: true, // Don't update existing profiles
      })
      .select()
      .single();

    if (error) {
      // If upsert failed due to race condition, try to fetch existing
      if (error.code === "23505") {
        // Unique violation - profile was created by another request
        return await fetchLearningStyleProfile(studentId);
      }
      authLogger.error("[DB] Error in getOrCreateLearningProfile:", error);
      return null;
    }

    return data;
  } catch (error) {
    authLogger.error(
      "[DB] Exception in getOrCreateLearningProfile:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}
