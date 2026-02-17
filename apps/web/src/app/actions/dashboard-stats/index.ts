/**
 * Barrel export file for dashboard stats actions
 * Re-exports all dashboard functions for backward compatibility
 */

// Core dashboard functions
export {
  getDashboardStats,
  getProgressStats,
  type DashboardStats,
  type ProgressStats,
} from "./dashboard-core";

// Progress analytics and calculations
export {
  calculateScoreAndTime,
  calculateModuleBreakdown,
  buildResponsesBySessionMap,
  calculateRecentAssessments,
  calculateStreak,
  type ModuleProgress,
  type AssessmentResult,
} from "./progress-analytics";

// Activity tracking
export { getRecentActivity, type RecentActivity } from "./activity-tracking";
