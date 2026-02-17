/**
 * Common type definitions used across the application
 * Centralized types to avoid union type duplication
 */

/**
 * Supported language codes for the application
 * - "en": English
 * - "hi": Hindi (हिंदी)
 * - "as": Assamese (অসমীয়া)
 */
export type SupportedLanguage = "en" | "hi" | "as";

/**
 * Difficulty level for questions and assessments
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Common proficiency level across the application
 */
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

/**
 * Filter type for language filtering (with null option)
 */
export type LanguageFilter = SupportedLanguage | null;
