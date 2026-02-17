"use client";

/**
 * Learn Page Header Component
 *
 * Provides consistent header across Learn pages with:
 * - Back to Dashboard link (translated)
 * - Language selector with localStorage persistence
 * - Page title and description (can use translation keys)
 */

import Link from "next/link";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n";

interface LearnHeaderProps {
  /** Title to display - can be a translation key like "learn.yourPath" or plain text */
  readonly title?: string;
  /** Description to display - can be a translation key or plain text */
  readonly description?: string;
  /** Custom back link (overrides default) */
  readonly backLink?: {
    href: string;
    label: string;
  };
  /** Whether to show the language selector */
  readonly showLanguageSelector?: boolean;
  /** Use translation keys for title/description instead of literal strings */
  readonly useTranslationKeys?: boolean;
}

export function LearnHeader({
  title,
  description,
  backLink,
  showLanguageSelector = true,
  useTranslationKeys = false,
}: LearnHeaderProps) {
  const { t } = useLanguage();

  // Resolve title - use translation key or literal string
  const displayTitle = useTranslationKeys && title
    ? t(title)
    : title || t("learn.yourPath");

  // Resolve description
  const displayDescription = useTranslationKeys && description
    ? t(description)
    : description || t("learn.masterDigitalLiteracy");

  // Resolve back link
  const resolvedBackLink = backLink || {
    href: "/app/dashboard",
    label: t("nav.backToDashboard"),
  };

  return (
    <div className="space-y-4">
      {/* Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={resolvedBackLink.href}
          className="inline-flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
        >
          ← {resolvedBackLink.label}
        </Link>

        {showLanguageSelector && <LanguageSelector />}
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{displayTitle}</h1>
        {displayDescription && (
          <p className="text-text-secondary">{displayDescription}</p>
        )}
      </div>
    </div>
  );
}
