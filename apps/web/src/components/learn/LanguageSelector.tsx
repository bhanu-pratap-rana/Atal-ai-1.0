"use client";

/**
 * Language Selector Component
 *
 * Provides a consistent language selection UI across the application.
 * Uses the unified language system for global language management.
 *
 * When language is changed here, it affects:
 * - All UI text (via t() function)
 * - Module/Unit/Topic names from database
 * - AI-generated lesson content
 */

import { useLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

// Re-export useLanguage for components that import from this file
export { useLanguage };

interface LanguageSelectorProps {
  /** Callback when language changes */
  readonly onChange?: (language: SupportedLanguage) => void;
  /** @deprecated Use variant="compact" instead */
  readonly compact?: boolean;
  /** Display variant: "full" shows buttons, "compact" shows dropdown */
  readonly variant?: "full" | "compact";
  /** Additional CSS classes */
  readonly className?: string;
}

/**
 * Language Selector
 *
 * Renders either a button group (full) or dropdown (compact) for language selection.
 *
 * @example
 * ```tsx
 * // Full variant with buttons
 * <LanguageSelector />
 *
 * // Compact dropdown
 * <LanguageSelector variant="compact" />
 *
 * // With callback
 * <LanguageSelector onChange={(lang) => console.log(lang)} />
 * ```
 */
export function LanguageSelector({
  onChange,
  compact = false,
  variant,
  className = "",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  // Support both compact prop and variant prop for flexibility
  const isCompact = variant === "compact" || compact;

  const handleChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    onChange?.(lang);
  };

  if (isCompact) {
    return (
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value as SupportedLanguage)}
        className={`text-sm rounded-md border bg-background px-2 py-1 ${className}`}
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeLabel}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`} role="group" aria-label="Language selection">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            language === lang.code
              ? "bg-primary text-white"
              : "bg-white text-text-secondary hover:bg-primary-light border border-border"
          }`}
          aria-label={`Switch to ${lang.label}`}
          aria-pressed={language === lang.code}
        >
          <span aria-hidden="true">{lang.flag}</span>
          <span>{lang.nativeLabel}</span>
        </button>
      ))}
    </div>
  );
}

// QUAL-010 FIX: Removed deprecated getStoredLanguage function
// Use useLanguage() hook instead for accessing the current language
