/**
 * Database Localization Utilities
 *
 * Helpers for extracting localized content from database entities
 * that use the `field_en`, `field_hi`, `field_as` naming pattern.
 */

import type { SupportedLanguage } from "./types";

/**
 * Generic helper to get a localized field from a database entity
 *
 * Works with any entity that has fields like `name_en`, `name_hi`, `name_as`
 * Automatically falls back to English if the requested language is not available
 *
 * @param entity - The database entity object
 * @param field - The base field name (e.g., "name", "description")
 * @param language - The target language
 * @returns The localized string, or empty string if not found
 *
 * @example
 * ```typescript
 * const module = { name_en: "Computer Basics", name_hi: "कंप्यूटर मूल बातें", name_as: "কম্পিউটাৰ মূল কথা" };
 * getLocalizedField(module, "name", "hi"); // → "कंप्यूटर मूल बातें"
 * getLocalizedField(module, "name", "en"); // → "Computer Basics"
 * ```
 */
export function getLocalizedField(
  entity: object,
  field: string,
  language: SupportedLanguage
): string {
  const record = entity as Record<string, unknown>;

  // Try the requested language first
  const langKey = `${field}_${language}`;
  const langValue = record[langKey];

  if (typeof langValue === "string" && langValue.length > 0) {
    return langValue;
  }

  // Fallback to English
  const fallbackKey = `${field}_en`;
  const fallbackValue = record[fallbackKey];

  if (typeof fallbackValue === "string") {
    return fallbackValue;
  }

  // Last resort: return empty string
  return "";
}

// ============================================
// Pre-built helpers for common entities
// ============================================

/**
 * Get localized module name
 */
export function getModuleName(
  module: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(module, "name", language);
}

/**
 * Get localized module description
 */
export function getModuleDescription(
  module: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(module, "description", language);
}

/**
 * Get localized module cultural note
 */
export function getModuleCulturalNote(
  module: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(module, "cultural_note", language);
}

/**
 * Get localized topic name
 */
export function getTopicName(
  topic: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(topic, "name", language);
}

/**
 * Get localized topic description
 */
export function getTopicDescription(
  topic: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(topic, "description", language);
}

/**
 * Get localized badge name
 */
export function getBadgeName(
  badge: object,
  language: SupportedLanguage
): string {
  return getLocalizedField(badge, "name", language);
}

