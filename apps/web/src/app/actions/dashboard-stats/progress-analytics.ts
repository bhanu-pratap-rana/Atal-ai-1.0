/**
 * Progress analytics and calculation utilities
 * Pure functions for performance metrics and statistical analysis
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { authLogger } from "@/lib/auth-logger";

export interface ModuleProgress {
  module: string;
  questionsAttempted: number;
  correctAnswers: number;
  averageScore: number;
}

export interface AssessmentResult {
  id: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
}

/**
 * Helper: Calculate average score and total time from responses
 */
export function calculateScoreAndTime(
  responses: Array<{ is_correct: boolean; rt_ms: number | null }> | null,
): { averageScore: number | null; totalTimeSpent: number } {
  if (!responses || responses.length === 0) {
    return { averageScore: null, totalTimeSpent: 0 };
  }

  const correctCount = responses.filter((r) => r.is_correct).length;
  const averageScore = Math.round((correctCount / responses.length) * 100);
  const totalTimeSpent = Math.round(
    responses.reduce((sum, r) => sum + (r.rt_ms || 0), 0) / 60000,
  ); // Convert to minutes

  return { averageScore, totalTimeSpent };
}

/**
 * Helper: Calculate module breakdown from responses
 */
export function calculateModuleBreakdown(
  responses: Array<{ module: string | null; is_correct: boolean }> | null,
): ModuleProgress[] {
  if (!responses || responses.length === 0) {
    return [];
  }

  const moduleMap = new Map<string, { attempted: number; correct: number }>();

  for (const response of responses) {
    const moduleName = response.module || "Unknown";
    const current = moduleMap.get(moduleName) || { attempted: 0, correct: 0 };
    current.attempted++;
    if (response.is_correct) current.correct++;
    moduleMap.set(moduleName, current);
  }

  const moduleBreakdown: ModuleProgress[] = [];
  for (const [module, stats] of moduleMap) {
    moduleBreakdown.push({
      module,
      questionsAttempted: stats.attempted,
      correctAnswers: stats.correct,
      averageScore: stats.attempted > 0
        ? Math.round((stats.correct / stats.attempted) * 100)
        : 0,
    });
  }

  return moduleBreakdown;
}

/**
 * Helper: Build responses map by session for O(1) lookup
 */
export function buildResponsesBySessionMap<T extends { session_id: string }>(
  responses: T[] | null,
): Map<string, T[]> {
  const responsesBySession = new Map<string, T[]>();
  responses?.forEach((r) => {
    const existing = responsesBySession.get(r.session_id) || [];
    existing.push(r);
    responsesBySession.set(r.session_id, existing);
  });
  return responsesBySession;
}

/**
 * Helper: Calculate recent assessments from sessions and responses
 */
export function calculateRecentAssessments(
  sessions: Array<{
    id: string;
    started_at: string;
    submitted_at: string | null;
  }> | null,
  responsesBySession: Map<
    string,
    Array<{ is_correct: boolean; rt_ms: number | null }>
  >,
): AssessmentResult[] {
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const recentAssessments: AssessmentResult[] = [];
  for (const session of sessions.slice(0, 5)) {
    const sessionResponses = responsesBySession.get(session.id) || [];
    const correctCount = sessionResponses.filter((r) => r.is_correct).length;
    const totalQuestions = sessionResponses.length;
    const timeSpent =
      sessionResponses.reduce((sum, r) => sum + (r.rt_ms || 0), 0) / 1000; // seconds

    recentAssessments.push({
      id: session.id,
      completedAt: session.submitted_at || session.started_at,
      score:
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0,
      totalQuestions,
      timeSpent: Math.round(timeSpent),
    });
  }

  return recentAssessments;
}

/**
 * Calculate consecutive days with activity (streak)
 *
 * FIXED: Now tracks activity from MULTIPLE sources, not just assessments:
 * - Assessment sessions (assessment_sessions.started_at)
 * - AI Tutor interactions (ai_tutor_interactions.created_at)
 * - Lesson progress (student_knowledge_state.last_attempt_at)
 *
 * PERFORMANCE: Uses Set-based lookup (O(1)) instead of array includes (O(n))
 *
 * TIMEZONE FIX (Migration 147): Use LOCAL date formatting instead of UTC
 * to ensure consistent date comparison across timezones.
 */
export async function calculateStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  try {
    // Fetch activity dates from multiple sources in parallel
    const [sessionsResult, interactionsResult, knowledgeStateResult] = await Promise.all([
      // Assessment sessions
      supabase
        .from("assessment_sessions")
        .select("started_at")
        .eq("user_id", userId),
      // AI Tutor interactions
      supabase
        .from("ai_tutor_interactions")
        .select("created_at")
        .eq("student_id", userId),
      // Lesson progress (only where student has attempted)
      supabase
        .from("student_knowledge_state")
        .select("last_attempt_at")
        .eq("student_id", userId)
        .not("last_attempt_at", "is", null),
    ]);

    // Combine all activity dates into a single Set
    const dateSet = new Set<string>();

    // Helper: Format date to LOCAL YYYY-MM-DD (fixes timezone issue)
    // Previously used toISOString() which converts to UTC, causing date mismatches
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Helper: Add date to set (normalizes to LOCAL YYYY-MM-DD format)
    const addDate = (dateString: string | null) => {
      if (!dateString) return;
      const date = new Date(dateString);
      // TIMEZONE FIX: Use local date formatting instead of toISOString() (UTC)
      const dateKey = formatLocalDate(date);
      dateSet.add(dateKey);
    };

    // Add assessment session dates
    sessionsResult.data?.forEach((s: { started_at: string }) => {
      addDate(s.started_at);
    });

    // Add AI tutor interaction dates
    interactionsResult.data?.forEach((i: { created_at: string }) => {
      addDate(i.created_at);
    });

    // Add lesson attempt dates
    knowledgeStateResult.data?.forEach((k: { last_attempt_at: string }) => {
      addDate(k.last_attempt_at);
    });

    if (dateSet.size === 0) return 0;

    // Calculate streak from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      // TIMEZONE FIX: Use local date formatting to match addDate() helper
      const dateKey = formatLocalDate(checkDate);

      if (dateSet.has(dateKey)) {
        streak++;
      } else if (i > 0) {
        // Allow skipping today (user might not have done activity yet today)
        // But break if any previous day is missing (streak broken)
        break;
      }
    }

    return streak;
  } catch (error) {
    authLogger.error(
      "[getStreak] Failed to calculate streak",
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}
