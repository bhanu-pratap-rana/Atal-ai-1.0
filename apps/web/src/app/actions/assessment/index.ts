/**
 * Barrel export file for assessment actions
 * Re-exports all assessment functions for backward compatibility
 */

// IRT models and configuration
export {
  type IRTItem,
  CATEGORIES,
  CAT_CONFIG,
  probability3PL,
  fisherInformation,
  stratifyByDiscrimination,
  updateTheta,
  selectNextItem,
} from "./irt-models";

// Adaptive question selection
export { getAdaptiveQuestions } from "./adaptive-selection";

// Assessment submission and scoring
export {
  submitAssessment,
  calculateIRTScore,
  startAssessment,
} from "./assessment-submission";

// Assessment status for pre/post prompts
export { getAssessmentStatus, type AssessmentStatus } from "./assessment-status";
