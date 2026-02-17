"use client";

/**
 * Unified Language System - Provider and Hook
 *
 * Provides language context to the entire application.
 * - Manages current language state
 * - Persists language preference to localStorage
 * - Provides t() translation function with interpolation support
 * - Dynamically loads translation files
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { clientLogger } from "@/lib/client-logger";
import type {
  SupportedLanguage,
  LanguageContextValue,
  InterpolationValues,
  TranslationFile,
} from "./types";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "./types";

// Import translation files statically for better performance
import enTranslations from "./locales/en.json";
import hiTranslations from "./locales/hi.json";
import asTranslations from "./locales/as.json";

/** Map of language codes to their translation objects */
const TRANSLATIONS: Record<SupportedLanguage, TranslationFile> = {
  en: enTranslations as TranslationFile,
  hi: hiTranslations as TranslationFile,
  as: asTranslations as TranslationFile,
};

/** Context for language state */
const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Validates if a string is a supported language code
 */
function isValidLanguage(lang: string | null): lang is SupportedLanguage {
  return (
    lang !== null &&
    SUPPORTED_LANGUAGES.some((l) => l.code === lang)
  );
}

/**
 * Gets the initial language from localStorage or defaults to English
 */
function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isValidLanguage(stored)) {
      return stored;
    }
  } catch {
    // localStorage might not be available (SSR, private browsing, etc.)
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Gets a nested value from an object using dot notation
 * Example: getNestedValue(obj, "common.loading") → obj.common.loading
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Interpolates values into a translation string
 * Example: interpolate("Hello, {name}!", { name: "John" }) → "Hello, John!"
 */
function interpolate(
  template: string,
  values?: InterpolationValues
): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : match;
  });
}

interface LanguageProviderProps {
  children: ReactNode;
  /** Optional initial language override (useful for testing) */
  initialLanguage?: SupportedLanguage;
}

/**
 * Language Provider Component
 *
 * Wraps the application and provides language context to all children.
 * Should be placed near the root of the component tree.
 *
 * @example
 * ```tsx
 * <LanguageProvider>
 *   <App />
 * </LanguageProvider>
 * ```
 */
export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  // Initialize with default, then hydrate from localStorage
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage ?? DEFAULT_LANGUAGE
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate language from localStorage on mount
  useEffect(() => {
    queueMicrotask(() => {
      if (!initialLanguage) {
        const storedLanguage = getInitialLanguage();
        setLanguageState(storedLanguage);
      }
      setIsHydrated(true);
    });
  }, [initialLanguage]);

  // Get current translations
  const translations = TRANSLATIONS[language];

  /**
   * Sets the language and persists to localStorage
   */
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // localStorage might not be available
    }
  }, []);

  /**
   * Translation function
   *
   * @param key - Dot-notation key like "common.loading"
   * @param values - Optional interpolation values
   * @returns Translated string, or the key itself if not found
   *
   * @example
   * ```tsx
   * t("common.loading") // → "Loading..."
   * t("dashboard.welcome", { name: "John" }) // → "Welcome, John!"
   * ```
   */
  const t = useCallback(
    (key: string, values?: InterpolationValues): string => {
      // Try to get translation for current language
      let value = getNestedValue(translations, key);

      // Fallback to English if not found
      if (value === undefined && language !== "en") {
        value = getNestedValue(TRANSLATIONS.en, key);
      }

      // If still not found, return the key itself
      if (value === undefined) {
        clientLogger.warn(`[i18n] Missing translation: "${key}" for language "${language}"`);
        return key;
      }

      return interpolate(value, values);
    },
    [translations, language]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      isLoading: !isHydrated,
    }),
    [language, setLanguage, t, isHydrated]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 *
 * @returns Language context with language, setLanguage, t, and isLoading
 * @throws Error if used outside of LanguageProvider
 *
 * @example
 * ```tsx
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
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (context === null) {
    throw new Error(
      "useLanguage must be used within a LanguageProvider. " +
        "Wrap your app with <LanguageProvider> in the root layout."
    );
  }

  return context;
}

/**
 * Hook to check if a language context is available
 * Useful for components that can work with or without translations
 */
export function useLanguageOptional(): LanguageContextValue | null {
  return useContext(LanguageContext);
}
