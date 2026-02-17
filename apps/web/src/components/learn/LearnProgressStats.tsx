"use client";

/**
 * Learn Progress Stats Component
 *
 * Displays overall learning progress statistics with translated labels.
 */

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

interface LearnProgressStatsProps {
  readonly overallProgress: number;
  readonly totalPoints: number;
  readonly currentStreak: number;
  readonly completedTopics: number;
  readonly totalTopics: number;
}

export function LearnProgressStats({
  overallProgress,
  totalPoints,
  currentStreak,
  completedTopics,
  totalTopics,
}: LearnProgressStatsProps) {
  const { t } = useLanguage();

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {overallProgress}%
            </div>
            <div className="text-sm text-text-secondary">
              {t("learn.overallProgress")}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-warning">
              {totalPoints}
            </div>
            <div className="text-sm text-text-secondary">
              {t("learn.totalPoints")}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-success">
              {currentStreak}
            </div>
            <div className="text-sm text-text-secondary">
              {t("learn.dayStreak")} 🔥
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="h-3 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>{completedTopics} {t("learn.topicsCompleted")}</span>
            <span>{totalTopics - completedTopics} {t("learn.remaining")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
