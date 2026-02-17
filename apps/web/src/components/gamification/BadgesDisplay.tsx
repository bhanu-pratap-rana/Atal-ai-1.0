"use client";

/**
 * Badges Display Component
 *
 * Shows earned and locked badges with cultural Assamese themes.
 * Features:
 * - 10 cultural badges (Muga Silk, Bihu, Brahmaputra, etc.)
 * - Trilingual names (English, Hindi, Assamese)
 * - Rarity tiers (common, uncommon, rare, legendary)
 * - Animated unlock effects
 */

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";
import type { Badge as BaseBadge } from "@/lib/services/gamification-service";
import { useLanguage } from "@/lib/i18n";

/**
 * Display-specific Badge type with earned status
 * Extends base Badge but makes unlock_criteria optional (not needed for display)
 * and adds earned_at for tracking when the badge was earned
 */
interface DisplayBadge extends Omit<
  BaseBadge,
  "unlock_criteria" | "cultural_note"
> {
  readonly cultural_note: string | null;
  readonly earned_at?: string;
}

interface BadgesDisplayProps {
  readonly studentId: string;
  readonly language?: "en" | "hi" | "as";
  readonly showAll?: boolean;
}

// Rarity colors and styles - using semantic CSS variables where possible
const RARITY_STYLES = {
  common: {
    bg: "bg-surface",
    border: "border-muted-foreground/30",
    text: "text-text-secondary",
    glow: "",
  },
  uncommon: {
    bg: "bg-success/10",
    border: "border-success",
    text: "text-success",
    glow: "shadow-success/20",
  },
  rare: {
    bg: "bg-primary/10",
    border: "border-primary",
    text: "text-primary",
    glow: "shadow-primary/30",
  },
  legendary: {
    bg: "bg-gradient-to-br from-warning/20 to-warning/10",
    border: "border-warning",
    text: "text-warning",
    glow: "shadow-warning/30 shadow-lg",
  },
};

/**
 * PERFORMANCE: Wrapped with memo to prevent unnecessary re-renders
 * when parent component state changes but props remain the same
 */
export const BadgesDisplay = memo(function BadgesDisplay({
  studentId,
  language: languageProp = "en",
  showAll = true,
}: BadgesDisplayProps) {
  const { language: contextLanguage, t } = useLanguage();
  // Use context language if available, otherwise fall back to prop
  const language = contextLanguage || languageProp;
  const [badges, setBadges] = useState<DisplayBadge[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<DisplayBadge | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousEarnedIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const fetchBadges = useCallback(async () => {
    try {
      const supabase = createClient();

      // Fetch all badges from the database
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("id, name_en, name_hi, name_as, description, icon, rarity, points_value, cultural_note")
        .order("rarity", { ascending: true });

      if (badgesError) {
        clientLogger.error("[BadgesDisplay] Error fetching badges:", {
          message: badgesError.message,
        });
        setBadges([]);
        setEarnedIds(new Set());
        setLoading(false);
        return;
      }

      // Fetch student's earned badges
      const { data: earnedData, error: earnedError } = await supabase
        .from("student_badges")
        .select("badge_id, earned_at")
        .eq("student_id", studentId);

      if (earnedError) {
        clientLogger.error("[BadgesDisplay] Error fetching earned badges:", {
          message: earnedError.message,
        });
      }

      // PERFORMANCE FIX: Build Map for O(1) earned_at lookups instead of O(n) find() in loop
      // Previously: O(n*m) where n=badges, m=earned badges
      // Now: O(n+m) - build map once, then O(1) lookups
      const earnedAtMap = new Map(
        earnedData?.map((e) => [e.badge_id, e.earned_at]) || [],
      );

      // Map database badges to component format
      const allBadges: DisplayBadge[] = (badgesData || []).map((b) => ({
        id: b.id,
        name_en: b.name_en,
        name_hi: b.name_hi,
        name_as: b.name_as,
        description: b.description,
        icon: b.icon,
        cultural_note: b.cultural_note,
        rarity: b.rarity as "common" | "uncommon" | "rare" | "legendary",
        points_value: b.points_value || 100,
        earned_at: earnedAtMap.get(b.id),
      }));

      // Create set of earned badge IDs
      const earnedSet = new Set(earnedData?.map((e) => e.badge_id) || []);

      // Check for newly earned badges (not on initial load)
      if (!isInitialLoadRef.current) {
        const previousIds = previousEarnedIdsRef.current;
        earnedSet.forEach((badgeId) => {
          if (!previousIds.has(badgeId)) {
            // Find the badge to show celebration toast
            const newBadge = allBadges.find((b) => b.id === badgeId);
            if (newBadge) {
              toast.success(
                `🏆 ${t("gamification.badgeEarned", { name: newBadge.name_en })}`,
                {
                  description: newBadge.cultural_note || newBadge.description,
                  duration: 5000,
                }
              );
              clientLogger.debug("[BadgesDisplay] New badge earned", {
                badgeId: newBadge.id,
                name: newBadge.name_en,
              });
            }
          }
        });
      }

      // Update refs for next comparison
      previousEarnedIdsRef.current = earnedSet;
      isInitialLoadRef.current = false;

      setBadges(allBadges);
      setEarnedIds(earnedSet);
      setLoading(false);
    } catch (error) {
      clientLogger.error(
        "[BadgesDisplay] Error:",
        error instanceof Error ? error : undefined,
      );
      setBadges([]);
      setEarnedIds(new Set());
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchBadges();

    // Subscribe to real-time badge updates
    const supabase = createClient();
    const subscription = supabase
      .channel(`badges:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_badges",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          // Refetch badges when a new badge is earned
          clientLogger.debug("[BadgesDisplay] Real-time badge update received");
          fetchBadges();
        }
      )
      .subscribe();

    // Cleanup: Use unsubscribe() for consistent pattern
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Manage dialog open/close state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedBadge) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [selectedBadge]);

  // Handle dialog close events
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      setSelectedBadge(null);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        setSelectedBadge(null);
      }
    };

    // A11Y-006 FIX: Explicit Escape key handler for better accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedBadge(null);
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getBadgeName = (badge: DisplayBadge) => {
    switch (language) {
      case "as":
        return badge.name_as;
      case "hi":
        return badge.name_hi;
      default:
        return badge.name_en;
    }
  };

  const earnedBadges = badges.filter((b) => earnedIds.has(b.id));
  const lockedBadges = badges.filter((b) => !earnedIds.has(b.id));
  const displayBadges = showAll ? badges : earnedBadges;

/**
   * Badge class helpers - S2301 compliance
   * Use status-based object keys instead of boolean params
   */
  const BADGE_CLASSES = {
    icon: { earned: "group-hover:scale-110", locked: "grayscale" },
    card: { locked: "bg-surface/50 border-dashed border-muted-foreground/30 opacity-60" },
    text: { locked: "text-text-secondary" },
  } as const;

  const getBadgeCardClass = (status: "earned" | "locked", rarity: string): string => {
    if (status === "locked") return BADGE_CLASSES.card.locked;
    const styles = RARITY_STYLES[rarity as keyof typeof RARITY_STYLES] || RARITY_STYLES.common;
    return `${styles.bg} ${styles.border} ${styles.glow} hover:scale-105`;
  };

  const getBadgeTextClass = (status: "earned" | "locked", rarity: string): string => {
    if (status === "locked") return BADGE_CLASSES.text.locked;
    const styles = RARITY_STYLES[rarity as keyof typeof RARITY_STYLES] || RARITY_STYLES.common;
    return styles.text;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`badge-skeleton-${i}`} className="animate-pulse text-center p-3">
            <div className="w-12 h-12 mx-auto bg-surface rounded-full" />
            <div className="h-3 bg-surface rounded mt-2 mx-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">
            {earnedBadges.length}
          </div>
          <div className="text-xs text-text-secondary">{t("gamification.earned")}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-text-secondary">
            {lockedBadges.length}
          </div>
          <div className="text-xs text-text-secondary">{t("gamification.locked")}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-warning">
            {earnedBadges.reduce((sum, b) => sum + b.points_value, 0)}
          </div>
          <div className="text-xs text-text-secondary">{t("gamification.points")}</div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {displayBadges.map((badge) => {
          const isEarned = earnedIds.has(badge.id);

          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative p-3 rounded-xl border-2 transition-all duration-300 overflow-hidden text-center ${getBadgeCardClass(isEarned ? "earned" : "locked", badge.rarity)}`}
            >
              {/* Lock Icon for Locked Badges */}
              {!isEarned && (
                <div className="absolute top-1 right-1 text-xs text-text-secondary">
                  🔒
                </div>
              )}

              {/* Badge Icon */}
              <div
                className={`text-3xl mb-1 transition-transform ${isEarned ? BADGE_CLASSES.icon.earned : BADGE_CLASSES.icon.locked}`}
              >
                {badge.icon}
              </div>

              {/* Badge Name */}
              <div className={`text-xs font-medium leading-tight line-clamp-2 ${getBadgeTextClass(isEarned ? "earned" : "locked", badge.rarity)}`}>
                {getBadgeName(badge)}
              </div>

              {/* Rarity + Points */}
              <div
                className={`text-[10px] mt-0.5 capitalize ${getBadgeTextClass(isEarned ? "earned" : "locked", badge.rarity)}`}
              >
                {badge.rarity}
              </div>
              <div className="text-[10px] text-text-secondary">
                +{badge.points_value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Badge Detail Modal - Using native dialog for accessibility (S6819) */}
      <dialog
        ref={dialogRef}
        className="max-w-md w-full p-0 bg-transparent backdrop:bg-black/50 rounded-lg"
        aria-labelledby="badge-modal-title"
      >
        {selectedBadge && (
          <Card className="w-full">
            <CardContent className="p-6 text-center">
              {/* Icon */}
              <div className="text-6xl mb-4">{selectedBadge.icon}</div>

              {/* Name in all languages */}
              <h3 id="badge-modal-title" className="text-xl font-bold">
                {selectedBadge.name_en}
              </h3>
              <p className="text-text-secondary">{selectedBadge.name_as}</p>
              <p className="text-sm text-text-secondary">
                {selectedBadge.name_hi}
              </p>

              {/* Description */}
              <p className="mt-4 text-sm">{selectedBadge.description}</p>

              {/* Cultural Note */}
              {selectedBadge.cultural_note && (
                <p className="mt-4 text-sm italic text-warning bg-warning/10 p-3 rounded-lg">
                  🏔️ {selectedBadge.cultural_note}
                </p>
              )}

              {/* Status */}
              <div className="mt-4">
                {earnedIds.has(selectedBadge.id) ? (
                  <span className="inline-block px-4 py-2 bg-success/10 text-success rounded-full font-medium">
                    ✓ {t("gamification.earned")} • +{selectedBadge.points_value} {t("gamification.points")}
                  </span>
                ) : (
                  <span className="inline-block px-4 py-2 bg-surface text-text-secondary rounded-full">
                    🔒 {t("gamification.locked")}
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="mt-4 text-sm text-text-secondary hover:text-primary"
                aria-label="Close badge details"
              >
                {t("common.close")}
              </button>
            </CardContent>
          </Card>
        )}
      </dialog>
    </div>
  );
});

/**
 * Compact Badge Display for Dashboard
 */
export function BadgesCompact({
  badges,
  maxDisplay = 5,
}: {
  readonly badges: Array<{ readonly id: string; readonly icon: string; readonly name: string }>;
  readonly maxDisplay?: number;
}) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg"
          title={badge.name}
        >
          {badge.icon}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-medium">
          +{remaining}
        </div>
      )}
    </div>
  );
}
