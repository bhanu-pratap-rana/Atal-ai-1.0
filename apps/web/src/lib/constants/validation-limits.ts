/**
 * Validation Limits Configuration Constants
 *
 * Centralized validation limits for forms, API inputs, and content.
 * Prevents hardcoded magic numbers scattered across the codebase.
 *
 * Rule.md Compliance:
 * - Single source of truth for validation limits
 * - Easy to modify and test
 * - Type-safe
 */

/**
 * AI Content Limits
 * Used by AI actions (tutor, essay, practice questions, summarizer)
 */
export const AI_CONTENT_LIMITS = {
  /** Minimum question length for AI tutor */
  questionMinLength: 3,
  /** Maximum question length for AI tutor */
  questionMaxLength: 2000,
  /** Minimum essay length for feedback */
  essayMinLength: 50,
  /** Maximum essay length for feedback */
  essayMaxLength: 10000,
  /** Minimum topic length for practice questions */
  topicMinLength: 3,
  /** Minimum practice question count */
  practiceQuestionsMin: 1,
  /** Maximum practice question count */
  practiceQuestionsMax: 20,
  /** Minimum content length for summarization */
  contentMinLength: 100,
  /** Maximum content length for summarization */
  contentMaxLength: 15000,
  /** Maximum text length for TTS (matches Google Cloud TTS service limit) */
  ttsMaxLength: 5000,
} as const;

/**
 * User Profile Field Limits
 * Used by registration, profile updates, etc.
 */
export const PROFILE_LIMITS = {
  /** Minimum name length */
  nameMinLength: 2,
  /** Maximum name length */
  nameMaxLength: 100,
  /** Maximum email length */
  emailMaxLength: 255,
  /** Maximum roll number length */
  rollNumberMaxLength: 50,
} as const;

/**
 * School & Class Field Limits
 */
export const SCHOOL_LIMITS = {
  /** Maximum school code length */
  schoolCodeMaxLength: 20,
  /** Maximum class name length */
  classNameMaxLength: 100,
  /** Maximum subject length */
  subjectMaxLength: 100,
  /** Maximum search query length */
  searchQueryMaxLength: 100,
} as const;

/**
 * Assessment & Response Limits
 */
export const ASSESSMENT_LIMITS = {
  /** Maximum item ID length */
  itemIdMaxLength: 100,
  /** Maximum module name length */
  moduleNameMaxLength: 100,
  /** Maximum focus blur count (sanity check) */
  focusBlurCountMax: 10000,
  /** Maximum option ID length */
  optionIdMaxLength: 100,
  /** Maximum responses per submission */
  responsesMaxCount: 1000,
} as const;

/**
 * Database Query Limits
 * Used for search results, pagination, etc.
 */
export const QUERY_LIMITS = {
  /** Default search results limit */
  searchResultsDefault: 20,
  /** Maximum search results per page */
  searchResultsMax: 100,
  /** Default pagination page size */
  paginationDefault: 25,
} as const;

/**
 * PIN Generation Limits
 * Used for staff PIN generation and validation
 */
export const PIN_LIMITS = {
  /** Minimum PIN value (4-digit starts at 1000) */
  min: 1000,
  /** Maximum PIN value (4-digit ends at 9999) */
  max: 9999,
  /** PIN length in digits */
  length: 4,
} as const;

/**
 * Type exports for TypeScript
 */
export type AIContentLimitKey = keyof typeof AI_CONTENT_LIMITS;
export type ProfileLimitKey = keyof typeof PROFILE_LIMITS;
export type SchoolLimitKey = keyof typeof SCHOOL_LIMITS;
export type AssessmentLimitKey = keyof typeof ASSESSMENT_LIMITS;
export type QueryLimitKey = keyof typeof QUERY_LIMITS;
export type PINLimitKey = keyof typeof PIN_LIMITS;
