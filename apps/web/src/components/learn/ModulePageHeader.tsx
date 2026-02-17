"use client";

/**
 * Module Page Header Component
 *
 * Client component for module topics page header.
 * Includes:
 * - Back to Learning Path link
 * - Language selector
 * - Download module button with language support
 */

import Link from "next/link";
import { LanguageSelector, useLanguage } from "./LanguageSelector";
import { DownloadModuleButton } from "@/components/offline/LessonPreCacher";

interface ModulePageHeaderProps {
  readonly moduleId: string;
  readonly moduleName: string;
}

export function ModulePageHeader({ moduleId, moduleName }: ModulePageHeaderProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Top Row: Back link and Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/app/learn"
          className="inline-flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
        >
          ← Back to Learning Path
        </Link>

        <LanguageSelector />
      </div>

      {/* Bottom Row: Download Button */}
      <div className="flex justify-end">
        <DownloadModuleButton
          moduleId={moduleId}
          moduleName={moduleName}
          language={language}
        />
      </div>
    </div>
  );
}
