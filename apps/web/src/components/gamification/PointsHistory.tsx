"use client";

/**
 * Points History Component
 *
 * Shows a timeline of all point transactions for a student.
 * Features:
 * - Chronological list of point earnings
 * - Filter by source (lesson, badge, streak, etc.)
 * - Running total display
 * - Real-time updates via Supabase subscription
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";
import { useLanguage } from "@/lib/i18n";
import {
  Star,
  Award,
  BookOpen,
  Flame,
  Mic,
  HelpCircle,
  TrendingUp,
  Filter,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsEntry {
  id: string;
  points: number;
  source: string;
  description: string | null;
  created_at: string | null;
}

interface PointsHistoryProps {
  readonly studentId: string;
  readonly limit?: number;
  readonly showFilter?: boolean;
  readonly compact?: boolean;
}

// Source icons and colors - labelKey is a translation key
const SOURCE_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; labelKey: string }
> = {
  lesson_complete: {
    icon: BookOpen,
    color: "text-success bg-success/10",
    labelKey: "gamification.sourceLesson",
  },
  badge_earned: {
    icon: Award,
    color: "text-warning bg-warning/10",
    labelKey: "gamification.sourceBadge",
  },
  streak_bonus: {
    icon: Flame,
    color: "text-accent bg-accent/10",
    labelKey: "gamification.sourceStreak",
  },
  voice_usage: {
    icon: Mic,
    color: "text-info bg-info/10",
    labelKey: "gamification.sourceVoice",
  },
  question_asked: {
    icon: HelpCircle,
    color: "text-secondary bg-secondary/10",
    labelKey: "gamification.sourceQuestion",
  },
  assessment_complete: {
    icon: Star,
    color: "text-secondary bg-secondary/10",
    labelKey: "gamification.sourceAssessment",
  },
  default: {
    icon: TrendingUp,
    color: "text-text-secondary bg-surface-dark",
    labelKey: "gamification.sourceOther",
  },
};

function getSourceConfig(source: string) {
  return SOURCE_CONFIG[source] || SOURCE_CONFIG.default;
}

interface DateFormatResult {
  key: string;
  values?: Record<string, string | number>;
}

function formatDateKey(dateString: string | null): DateFormatResult | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins <= 1) return { key: "gamification.justNow" };
      return { key: "gamification.minutesAgo", values: { count: diffMins } };
    }
    return { key: "gamification.hoursAgo", values: { count: diffHours } };
  }
  if (diffDays === 1) return { key: "gamification.yesterday" };
  if (diffDays < 7) return { key: "gamification.daysAgo", values: { count: diffDays } };

  // For older dates, return the formatted date string directly
  return {
    key: "gamification.dateFormat",
    values: {
      date: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      }),
    },
  };
}

export function PointsHistory({
  studentId,
  limit = 50,
  showFilter = true,
  compact = false,
}: PointsHistoryProps) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  // PERF-005 FIX: Use RPC for efficient server-side aggregation instead of fetching all rows
  const fetchTotal = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: total, error } = await supabase.rpc(
        "get_student_total_points",
        { p_student_id: studentId },
      );

      if (error) {
        clientLogger.error("[PointsHistory] Error fetching total:", { message: error.message });
        return;
      }

      setTotalPoints(total ?? 0);
    } catch (error) {
      clientLogger.error("[PointsHistory] Error fetching total:",
        error instanceof Error ? error : undefined
      );
    }
  }, [studentId]);

  const fetchHistory = useCallback(async (fetchTotalToo = false) => {
    try {
      const supabase = createClient();

      let query = supabase
        .from("points_history")
        .select("id, points, source, description, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (selectedSource) {
        query = query.eq("source", selectedSource);
      }

      const { data, error } = await query;

      if (error) {
        clientLogger.error("[PointsHistory] Error fetching history:", {
          message: error.message,
        });
        setEntries([]);
        return;
      }

      setEntries(data || []);

      // PERF-005 FIX: Only fetch total when explicitly requested (initial load, realtime updates)
      // Filter changes should NOT trigger total re-fetch since total doesn't depend on filter
      if (fetchTotalToo) {
        await fetchTotal();
      }
    } catch (error) {
      clientLogger.error(
        "[PointsHistory] Error:",
        error instanceof Error ? error : undefined
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedSource, limit, fetchTotal]);

  // PERF-005 FIX: Fetch total only on mount and realtime updates (not on filter changes)
  useEffect(() => {
    fetchHistory(true); // Initial load - fetch both history and total

    // Subscribe to real-time updates
    const supabase = createClient();
    const subscription = supabase
      .channel(`points:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "points_history",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          clientLogger.debug("[PointsHistory] Real-time update received");
          fetchHistory(true); // Realtime update - fetch both history and total
        }
      )
      .subscribe();

    // Cleanup: Use unsubscribe() for consistent pattern
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // PERF-005 FIX: Separate effect for filter changes - only refetch history, not total
  useEffect(() => {
    if (selectedSource !== null) {
      fetchHistory(false); // Filter change - only fetch history, not total
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  // Get unique sources for filter
  const uniqueSources = Array.from(
    new Set(entries.map((e) => e.source).filter(Boolean))
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`skeleton-${i}`} className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-surface rounded w-3/4 mb-1" />
              <div className="h-3 bg-surface rounded w-1/2" />
            </div>
            <div className="h-5 bg-surface rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Total Points Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">{t("gamification.totalPoints")}</span>
          <span className="text-xl font-bold text-primary">{totalPoints}</span>
        </div>

        {/* Recent entries */}
        {entries.slice(0, 5).map((entry) => {
          const config = getSourceConfig(entry.source);
          const IconComponent = config.icon;

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <IconComponent className={cn("w-4 h-4", config.color.split(" ")[0])} />
                <span className="text-text-secondary truncate max-w-[150px]">
                  {entry.description || t(config.labelKey)}
                </span>
              </div>
              <span className="font-medium text-success">+{entry.points}</span>
            </div>
          );
        })}

        {entries.length > 5 && (
          <div className="text-xs text-text-tertiary text-center pt-2">
            {t("gamification.moreTransactions", { count: entries.length - 5 })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Total and Filter */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-primary">{totalPoints}</div>
          <div className="text-sm text-text-secondary">{t("gamification.totalPoints")}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHistory(true)}
            className="gap-1"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Source Filter */}
      {showFilter && uniqueSources.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <button
            onClick={() => setSelectedSource(null)}
            className={cn(
              "text-xs px-2 py-1 rounded-full transition-colors",
              selectedSource === null
                ? "bg-primary text-white"
                : "bg-surface hover:bg-surface"
            )}
          >
            {t("gamification.all")}
          </button>
          {uniqueSources.map((source) => {
            const config = getSourceConfig(source);
            return (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full transition-colors",
                  selectedSource === source
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface"
                )}
              >
                {t(config.labelKey)}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <h3 className="font-medium text-text mb-1">{t("gamification.noPointsYet")}</h3>
            <p className="text-sm text-text-secondary">
              {t("gamification.earnPointsHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Points Timeline */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const config = getSourceConfig(entry.source);
          const IconComponent = config.icon;
          const dateResult = formatDateKey(entry.created_at);
          const formattedDate = dateResult
            ? t(dateResult.key, dateResult.values)
            : "";

          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  config.color
                )}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text truncate">
                  {entry.description || t(config.labelKey)}
                </div>
                <div className="text-xs text-text-tertiary flex items-center gap-2">
                  <span className="capitalize">{t(config.labelKey)}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Points */}
              <div
                className={cn(
                  "font-bold text-lg shrink-0",
                  entry.points > 0 ? "text-success" : "text-error"
                )}
              >
                {entry.points > 0 ? "+" : ""}
                {entry.points}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Points Summary Card for Dashboard
 */
export function PointsSummary({
  studentId,
}: {
  readonly studentId: string;
}) {
  const { t } = useLanguage();
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [todayPoints, setTodayPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const supabase = createClient();

        // PERF: Use RPC for total instead of fetching all rows
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalResult, todayResult] = await Promise.all([
          supabase.rpc("get_student_total_points", { p_student_id: studentId }),
          supabase
            .from("points_history")
            .select("points")
            .eq("student_id", studentId)
            .gte("created_at", today.toISOString()),
        ]);

        if (!totalResult.error) {
          setTotalPoints(totalResult.data ?? 0);
        }

        if (!todayResult.error && todayResult.data) {
          const todayTotal = todayResult.data.reduce(
            (sum, entry) => sum + entry.points,
            0,
          );
          setTodayPoints(todayTotal);
        }
      } catch (error) {
        clientLogger.error(
          "[PointsSummary] Error:",
          error instanceof Error ? error : undefined
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [studentId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-surface rounded w-20 mb-1" />
        <div className="h-4 bg-surface rounded w-24" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-3xl font-bold text-primary">
          {totalPoints ?? 0}
        </div>
        <div className="text-sm text-text-secondary">{t("gamification.totalPoints")}</div>
      </div>
      {todayPoints > 0 && (
        <div className="border-l border-border pl-6">
          <div className="text-xl font-bold text-success">+{todayPoints}</div>
          <div className="text-sm text-text-secondary">{t("gamification.today")}</div>
        </div>
      )}
    </div>
  );
}
