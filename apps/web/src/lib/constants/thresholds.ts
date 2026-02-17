/**
 * Mastery and Scoring Thresholds
 *
 * Centralized constants for mastery scoring across the application.
 * These values are used consistently in:
 * - Progress tracking (student_knowledge_state)
 * - Gamification (bonus points, badges)
 * - UI components (progress bars, completion status)
 * - Database functions (atomic progress updates)
 *
 * IMPORTANT: If changing PASSING threshold, also update:
 * - Migration 151 (update_progress_atomic function)
 * - Any database CHECK constraints
 */

/**
 * Mastery score thresholds (0-100 scale)
 */
export const MASTERY_THRESHOLDS = {
  /**
   * Minimum score to be considered "mastered"
   * Used in: progress checks, status determination, completion counting
   */
  PASSING: 70,

  /**
   * Score threshold for high-score bonus points
   * Used in: gamification service
   */
  HIGH_SCORE_BONUS: 90,

  /**
   * Perfect score
   * Used in: gamification badges, special achievements
   */
  PERFECT: 100,

  /**
   * Threshold indicating a student is struggling
   * Used in: adaptive recommendations, intervention triggers
   */
  STRUGGLING: 50,

  /**
   * Minimum score for medium confidence level
   * Used in: confidence_level field in knowledge state
   */
  MEDIUM_CONFIDENCE: 70,

  /**
   * Minimum score for high confidence level
   * Used in: confidence_level field in knowledge state
   */
  HIGH_CONFIDENCE: 90,
} as const;

/**
 * Maximum score without quiz verification
 * When a lesson has no practice questions, we cap the mastery score
 * to ensure students can't achieve "mastered" without demonstrating knowledge
 */
export const MAX_SCORE_WITHOUT_QUIZ = 85;

/**
 * Minimum number of topics a module must have before it can be considered "mastered".
 * Used in: gamification service (module mastery badge checks)
 */
export const MIN_TOPICS_FOR_MODULE_MASTERY = 10;

/**
 * Confidence level determination based on score
 */
export function getConfidenceLevel(score: number): "low" | "medium" | "high" {
  if (score >= MASTERY_THRESHOLDS.HIGH_CONFIDENCE) {
    return "high";
  }
  if (score >= MASTERY_THRESHOLDS.MEDIUM_CONFIDENCE) {
    return "medium";
  }
  return "low";
}

/**
 * Determine status based on score
 */
export function getStatusFromScore(score: number): "in_progress" | "mastered" {
  return score >= MASTERY_THRESHOLDS.PASSING ? "mastered" : "in_progress";
}

/**
 * Check if score qualifies for passing
 */
export function isPassingScore(score: number): boolean {
  return score >= MASTERY_THRESHOLDS.PASSING;
}

/**
 * Check if score qualifies for high-score bonus
 */
export function qualifiesForBonus(score: number): boolean {
  return score >= MASTERY_THRESHOLDS.HIGH_SCORE_BONUS;
}

// Type for mastery threshold keys
export type MasteryThresholdKey = keyof typeof MASTERY_THRESHOLDS;

/**
 * Calculate mastery score based on lesson completion.
 *
 * @param practiceQuestions - Array of practice questions
 * @param answers - Map of question ID to selected answer index
 * @param completedChunks - Number of completed content chunks
 * @param totalChunks - Total number of content chunks
 * @param isDynamicMode - Whether lesson is in dynamic generation mode
 * @returns Calculated mastery score (0-100)
 */
export function calculateMasteryScore(
  practiceQuestions: Array<{ id: string; correct: number }>,
  answers: Record<string, number | null>,
  completedChunks: number,
  totalChunks: number,
  isDynamicMode: boolean,
): number {
  // For lessons with practice questions, calculate based on correct answers
  if (practiceQuestions.length > 0) {
    let correct = 0;
    for (const q of practiceQuestions) {
      if (answers[q.id] === q.correct) {
        correct++;
      }
    }
    return Math.round((correct / practiceQuestions.length) * 100);
  }

  // For dynamic lessons without questions, calculate based on chunk completion
  if (isDynamicMode) {
    const safeTotal = Math.max(totalChunks, 1);
    const completionRatio = completedChunks / safeTotal;
    // Max score without quiz verification (100% completion = MAX_SCORE_WITHOUT_QUIZ)
    // This ensures students can't achieve "mastered" without demonstrating knowledge
    return Math.round(completionRatio * MAX_SCORE_WITHOUT_QUIZ);
  }

  // Static lessons without questions - no mastery can be determined
  return 0;
}
