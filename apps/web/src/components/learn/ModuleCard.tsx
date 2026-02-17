"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage, getLocalizedField } from "@/lib/i18n";

export interface ModuleProgress {
  readonly module_id: string;
  readonly topics_completed: number;
  readonly average_mastery: number;
  readonly is_complete: boolean;
}

export interface Module {
  readonly id: string;
  readonly name_en: string;
  readonly name_as: string;
  readonly description: string;
  readonly description_en?: string;
  readonly description_hi?: string;
  readonly description_as?: string;
  readonly icon: string;
  readonly topics: number;
  readonly color: string;
  readonly culturalNote?: string;
  readonly cultural_note_en?: string;
  readonly cultural_note_hi?: string;
  readonly cultural_note_as?: string;
  readonly name_hi?: string;
  [key: string]: unknown; // For getLocalizedField compatibility
}

interface ModuleCardProps {
  readonly module: Module;
  readonly progress: ModuleProgress;
  readonly progressPercent: number;
  readonly isUnlocked: boolean;
  readonly index: number;
}

export function ModuleCard({
  module,
  progress,
  progressPercent,
  isUnlocked,
  index,
}: ModuleCardProps) {
  const { language, t } = useLanguage();

  // Get localized module content
  const moduleName = getLocalizedField(module, "name", language);
  const moduleDescription = getLocalizedField(module, "description", language) || module.description;
  const culturalNote = getLocalizedField(module, "cultural_note", language) || module.culturalNote;

  // Get secondary name for display (show Assamese if not selected, or Hindi if Assamese selected)
  const secondaryName = language === "as"
    ? module.name_hi || module.name_en
    : module.name_as;

  // Get button label based on progress
  const getButtonLabel = () => {
    if (progress.is_complete) return t("learn.reviewModule");
    if (progress.topics_completed > 0) return t("learn.continueModule");
    return t("learn.startModule");
  };

  return (
    <Card
      className={`transition-all ${
        isUnlocked
          ? "hover:shadow-lg cursor-pointer"
          : "opacity-60 cursor-not-allowed"
      } ${progress.is_complete ? "border-success border-2" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* A11Y-002 FIX: Added role="img" and aria-label for screen reader accessibility */}
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl shadow-lg`}
              role="img"
              aria-label={`${moduleName} module icon`}
            >
              {module.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {moduleName}
                {progress.is_complete && (
                  <span className="text-success">✓</span>
                )}
                {!isUnlocked && <span className="text-sm">🔒</span>}
              </CardTitle>
              {secondaryName && (
                <p className="text-xs text-text-secondary">{secondaryName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {progress.topics_completed}/{module.topics}
            </div>
            <div className="text-xs text-text-secondary">{t("learn.topics")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-text-secondary mb-3">
          {moduleDescription}
        </p>

        {culturalNote && (
          <p className="text-xs text-warning-dark mb-3 flex items-center gap-1">
            <span>🏔️</span> {culturalNote}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progress.is_complete
                  ? "bg-success"
                  : `bg-gradient-to-r ${module.color}`
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>{progressPercent}% {t("learn.complete")}</span>
            <span>{t("learn.avg")} {progress.average_mastery}%</span>
          </div>
        </div>

        {/* Action Button */}
        {isUnlocked && (
          <div className="mt-4">
            <Link href={`/app/learn/${module.id}`}>
              <Button
                className={`w-full bg-gradient-to-r ${module.color}`}
                variant={progress.is_complete ? "outline" : "default"}
              >
                {getButtonLabel()}
              </Button>
            </Link>
          </div>
        )}

        {!isUnlocked && (
          <div className="mt-4 text-center text-sm text-text-secondary">
            {t("learn.completeToUnlock", { n: String(index) })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
