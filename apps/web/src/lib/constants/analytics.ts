/**
 * Analytics and Learning Metrics Constants
 * Centralized constants for analytics-related functionality
 *
 * These constants are used for:
 * - Student engagement tracking
 * - At-risk student identification
 * - Learning pattern analysis
 */

// ============================================================================
// ANALYTICS & LEARNING METRICS CONSTANTS
// ============================================================================

/**
 * Analytics lookback window in days
 * Used to: Calculate engagement metrics, active user counts, learning patterns
 * Business logic: 7 days = 1 week, standard period for engagement analysis
 */
export const ANALYTICS_WINDOW_DAYS = 7

/**
 * Rapid response threshold in milliseconds
 * Used to: Flag potentially disengaged or rushing students
 * Business logic: Responses < 5 seconds indicate student is guessing/not reading content
 * Helps identify students at risk of poor learning outcomes
 */
export const RAPID_RESPONSE_THRESHOLD_MS = 5000

/**
 * At-risk indicator: rapid response percentage threshold
 * Used to: Flag students with excessive rapid responses as requiring intervention
 * Business logic: If >= 30% of responses are rapid, student is at-risk
 * Teachers use this to identify students needing support
 */
export const AT_RISK_RAPID_PERCENTAGE = 0.3 // 30%

/**
 * At-risk indicator: student inactivity threshold in days
 * Used to: Flag students who haven't submitted assessments recently
 * Business logic: No activity in 7+ days = potential dropout risk
 */
export const INACTIVITY_THRESHOLD_DAYS = 7
