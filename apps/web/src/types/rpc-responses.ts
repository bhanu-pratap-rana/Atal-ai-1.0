/**
 * RPC Response Type Definitions
 *
 * Type definitions for all Supabase RPC (Remote Procedure Call) function responses
 * These match the RETURNS TABLE definitions in the database migrations
 */

/**
 * Response from batch_check_and_award_badges RPC
 * Migration: 156_fix_badge_id_ambiguity.sql (latest)
 * Returns only the fields defined in RETURNS TABLE
 */
export interface BatchCheckAwardBadgesResponse {
  badge_id: string;
  badge_name_en: string;
  badge_name_hi: string;
  badge_name_as: string;
  points_awarded: number;
}

/**
 * Response from update_progress_atomic RPC
 * Migration: 155_fix_knowledge_state_status.sql
 * Atomic progress update with race condition prevention
 */
export interface UpdateProgressAtomicResponse {
  success: boolean;
  mastery_score: number;
  status: "not_started" | "in_progress" | "mastered";
  confidence_level: "low" | "medium" | "high";
  attempts: number;
  error?: string;
}

/**
 * Response from get_class_leaderboard RPC
 * Migration: 126_get_class_leaderboard.sql
 */
export interface GetClassLeaderboardResponse {
  student_id: string;
  student_name: string;
  total_points: number;
  badges_earned: number;
  rank: number;
}

/**
 * Response from get_school_metrics RPC
 * Migration: 127_fix_get_school_metrics.sql
 */
export interface GetSchoolMetricsResponse {
  school_id: string;
  school_name: string;
  teacher_count: number;
  student_count: number;
  active_pin_count: number;
  total_classes: number;
}

/**
 * Response from get_class_student_progress RPC
 * Migration: 124_get_class_student_progress.sql
 */
export interface GetClassStudentProgressResponse {
  student_id: string;
  student_name: string;
  total_topics: number;
  topics_mastered: number;
  avg_mastery_score: number;
  last_activity: string | null;
}

/**
 * Response from search_curriculum_content RPC
 * Migration: 052_curriculum_rag_search.sql
 */
export interface SearchCurriculumContentResponse {
  id: string;
  topic_id: string;
  topic_name: string;
  module_name: string;
  content_type: "text" | "example" | "practice";
  content: string;
  language: "en" | "hi" | "as";
  similarity: number;
}

/**
 * Response from hybrid_search RPC
 * Migration: 054_hybrid_search.sql
 */
export interface HybridSearchResponse {
  id: string;
  topic_id: string;
  topic_name: string;
  module_name: string;
  content_type: "text" | "example" | "practice";
  content: string;
  language: "en" | "hi" | "as";
  similarity: number;
  rank: number;
}

/**
 * Response from submit_assessment RPC
 * Migration: 077_fix_submit_assessment_nested_aggregates.sql
 */
export interface SubmitAssessmentResponse {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  ability_estimate: number;
  mastery_level: "beginner" | "intermediate" | "advanced" | "expert";
}

/**
 * Generic RPC error response
 */
export interface RPCErrorResponse {
  error: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Type guard to check if RPC response is an error
 */
export function isRPCError(response: unknown): response is RPCErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as RPCErrorResponse).error === "string"
  );
}

/**
 * Type for RPC call result (success or error)
 */
export type RPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to wrap RPC responses in result type
 */
export function wrapRPCResult<T>(
  data: T | null,
  error: string | null,
): RPCResult<T> {
  if (error || !data) {
    return { success: false, error: error || "Unknown RPC error" };
  }
  return { success: true, data };
}
