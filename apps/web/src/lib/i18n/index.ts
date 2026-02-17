/**
 * Unified Language System (i18n)
 *
 * This module provides internationalization support for the ATAL AI application.
 * Supports English, Hindi, and Assamese languages.
 *
 * Usage:
 * ```tsx
 * // In a component
 * import { useLanguage } from "@/lib/i18n";
 *
 * function MyComponent() {
 *   const { language, setLanguage, t } = useLanguage();
 *
 *   return (
 *     <div>
 *       <p>{t("common.loading")}</p>
 *       <button onClick={() => setLanguage("hi")}>
 *         Switch to Hindi
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * For database entities:
 * ```tsx
 * import { getLocalizedField, getModuleName } from "@/lib/i18n";
 *
 * const name = getModuleName(module, language);
 * const description = getLocalizedField(module, "description", language);
 * ```
 */

// Context and hooks
export { LanguageProvider, useLanguage, useLanguageOptional } from "./LanguageProvider";

// Types
export type {
  SupportedLanguage,
  LanguageInfo,
  InterpolationValues,
  TranslationFunction,
  LanguageContextValue,
  TranslationFile,
  // Namespace types
  CommonTranslations,
  NavTranslations,
  DashboardTranslations,
  LearnTranslations,
  GamificationTranslations,
  AuthTranslations,
  OfflineTranslations,
  ErrorTranslations,
} from "./types";

// Constants
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from "./types";

// Database utilities
export {
  getLocalizedField,
  getModuleName,
  getModuleDescription,
  getModuleCulturalNote,
  getTopicName,
  getTopicDescription,
  getBadgeName,
} from "./database-utils";
