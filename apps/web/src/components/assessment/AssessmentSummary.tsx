"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResultCircle } from "./ResultCircle";
import { CategoryBreakdown, CategoryStrengths } from "./CategoryBreakdown";
import { LevelBadge, LevelCard } from "./LevelBadge";
import { AssessmentStats } from "./AssessmentStats";
import { CelebrationAnimation } from "@/components/animations/LottieAnimation";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

/**
 * ATAL AI Assessment Summary - Enhanced with IRT Scoring
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 *
 * Features:
 * - IRT-based ability estimation (theta score)
 * - Circular score display with animation
 * - Category breakdown with progress bars
 * - Skill level badge with IRT proficiency
 * - Strengths/weaknesses analysis
 * - Retake assessment option
 */

interface IRTCategoryScore {
  readonly theta: number;
  readonly score: number;
  readonly proficiency: string;
  readonly correct: number;
  readonly total: number;
}

interface IRTData {
  readonly theta: number;
  readonly standardError: number;
  readonly proficiencyLevel: string;
  readonly categoryScores: Record<string, IRTCategoryScore>;
}

interface ComparisonModuleData {
  readonly score: number;
  readonly total: number;
  readonly correct: number;
}

interface ComparisonData {
  readonly pre: { score: number; modules: Record<string, ComparisonModuleData> } | null;
  readonly post: { score: number; modules: Record<string, ComparisonModuleData> } | null;
}

interface AssessmentSummaryProps {
  readonly score: number;
  readonly totalQuestions: number;
  readonly correctAnswers: number;
  readonly moduleBreakdown: Record<string, { total: number; correct: number }>;
  readonly avgResponseTime: number;
  readonly sessionType?: "pre" | "adaptive" | "post";
  readonly comparisonData?: ComparisonData | null;
  readonly irtData?: IRTData;
}

/** Category display names */
const CATEGORY_NAMES: Record<string, string> = {
  contextual_application: "Contextual Application",
  digital_content_creation: "Digital Content Creation",
  digital_device_familiarity: "Device Familiarity",
  internet_web_awareness: "Internet & Web",
  problem_solving_aptitude: "Problem Solving",
};

/** Map IRT assessment categories to curriculum module IDs */
const CATEGORY_TO_MODULE: Record<string, string> = {
  digital_device_familiarity: "M1",
  internet_web_awareness: "M2",
  digital_content_creation: "M3",
  contextual_application: "M4",
  problem_solving_aptitude: "M5",
};

/** Find the module ID for the weakest category */
function getWeakestModule(
  breakdown: Record<string, { total: number; correct: number }>,
): string | null {
  let weakest: string | null = null;
  let lowestScore = Infinity;
  for (const [category, data] of Object.entries(breakdown)) {
    const catScore = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    if (catScore < lowestScore) {
      lowestScore = catScore;
      weakest = category;
    }
  }
  return weakest ? CATEGORY_TO_MODULE[weakest] ?? null : null;
}

/** Get per-category scores as percentage */
function getCategoryScores(
  breakdown: Record<string, { total: number; correct: number }>,
): { category: string; name: string; score: number; moduleId: string }[] {
  return Object.entries(breakdown).map(([category, data]) => ({
    category,
    name: CATEGORY_NAMES[category] || category.replace(/_/g, " "),
    score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    moduleId: CATEGORY_TO_MODULE[category] || "M1",
  }));
}

export function AssessmentSummary({
  score,
  totalQuestions,
  correctAnswers,
  moduleBreakdown,
  avgResponseTime,
  sessionType = "adaptive",
  comparisonData,
  irtData,
}: AssessmentSummaryProps) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(score >= 80);

  const getScoreMessage = (s: number) => {
    if (sessionType === "pre") {
      return {
        emoji: "📋",
        title: "Assessment Complete!",
        message: "We now know your starting level. Let's begin your learning journey!",
      };
    }
    if (sessionType === "post" && comparisonData?.pre) {
      const preScore = comparisonData.pre.score;
      const improvement = s - preScore;
      if (improvement > 20) {
        return {
          emoji: "🏆",
          title: "Outstanding Improvement!",
          message: `You improved by ${Math.round(improvement)}%! Your hard work has truly paid off.`,
        };
      } else if (improvement > 0) {
        return {
          emoji: "📈",
          title: "Great Progress!",
          message: `You improved by ${Math.round(improvement)}%. Keep pushing forward!`,
        };
      }
      return {
        emoji: "💪",
        title: "Assessment Complete!",
        message: "Review your results below to see where you can improve further.",
      };
    }
    if (s >= 80) {
      return {
        emoji: "🎉",
        title: "Excellent Work!",
        message: "You have a strong foundation in digital literacy. Great job!",
      };
    } else if (s >= 60) {
      return {
        emoji: "👍",
        title: "Good Job!",
        message:
          "You have a solid understanding. Keep building on this foundation!",
      };
    } else if (s >= 40) {
      return {
        emoji: "📚",
        title: "Great Start!",
        message:
          "You are on your way! The lessons will help strengthen your skills.",
      };
    } else {
      return {
        emoji: "🚀",
        title: "Ready to Learn!",
        message:
          "This is your starting point. Every expert was once a beginner!",
      };
    }
  };

  const scoreMessage = getScoreMessage(score);

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card - Celebration */}
        <div className="card-gradient mb-6">
          <div className="bg-white rounded-xl p-6 md:p-8">
            {/* Celebration Banner */}
            <div className="text-center mb-6">
              {/* Celebration Animation for high scores */}
              {showCelebration && (
                <div className="flex justify-center mb-4">
                  <CelebrationAnimation
                    size={150}
                    onComplete={() => setShowCelebration(false)}
                  />
                </div>
              )}
              <span className="text-5xl mb-4 block">{scoreMessage.emoji}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                {scoreMessage.title}
              </h1>
              <p className="text-lg text-text-secondary">
                {scoreMessage.message}
              </p>
            </div>

            {/* Score and Level Row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6 border-t border-b border-border">
              {/* Score Circle */}
              <ResultCircle
                percentage={score}
                size={160}
                label="Overall Score"
              />

              {/* Stats Column */}
              <div className="flex flex-col gap-4 text-center md:text-left">
                {/* Correct/Total */}
                <div>
                  <div className="text-3xl font-bold text-text-primary">
                    {correctAnswers}/{totalQuestions}
                  </div>
                  <div className="text-sm text-text-tertiary">
                    Correct Answers
                  </div>
                </div>

                {/* Level Badge */}
                <div>
                  <LevelBadge score={score} size="lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="card">
            <CategoryBreakdown categories={moduleBreakdown} />
          </div>

          {/* Strengths & Weaknesses + Stats */}
          <div className="space-y-6">
            {/* Strengths & Weaknesses */}
            <div className="card space-y-4">
              <CategoryStrengths
                categories={moduleBreakdown}
                type="strengths"
              />
              <CategoryStrengths
                categories={moduleBreakdown}
                type="weaknesses"
              />
            </div>

            {/* Quick Stats */}
            <AssessmentStats
              avgResponseTime={avgResponseTime}
              moduleBreakdown={moduleBreakdown}
              irtData={irtData}
            />
          </div>
        </div>

        {/* Level Card */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Your Skill Level
          </h2>
          <LevelCard score={score} className="max-w-sm mx-auto" />
        </div>

        {/* Pre vs Post Comparison (only for post-assessment with pre data) */}
        {sessionType === "post" && comparisonData?.pre && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Your Improvement
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-surface/50 rounded-lg">
                <div className="text-sm text-text-tertiary mb-1">Pre-Assessment</div>
                <div className="text-3xl font-bold text-text-secondary">
                  {Math.round(comparisonData.pre.score)}%
                </div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-sm text-text-tertiary mb-1">Post-Assessment</div>
                <div className="text-3xl font-bold text-primary">
                  {score}%
                </div>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-sm text-text-tertiary mb-1">Improvement</div>
                <div className={`text-3xl font-bold ${score - comparisonData.pre.score > 0 ? "text-success" : "text-error"}`}>
                  {score - Math.round(comparisonData.pre.score) > 0 ? "+" : ""}
                  {Math.round(score - comparisonData.pre.score)}%
                </div>
              </div>
            </div>

            {/* Per-category comparison */}
            <div className="space-y-3">
              {Object.entries(moduleBreakdown).map(([module, data]) => {
                const preModule = comparisonData.pre?.modules?.[module];
                const postScore = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                const preScore = preModule?.score ?? 0;
                const diff = postScore - Math.round(preScore);
                return (
                  <div key={module} className="flex items-center gap-3">
                    <div className="w-40 text-sm font-medium text-text-secondary truncate">
                      {CATEGORY_NAMES[module] || module.replace(/_/g, " ")}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-text-tertiary/40 rounded-full"
                          style={{ width: `${Math.round(preScore)}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${postScore}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-14 text-right text-sm font-bold ${diff > 0 ? "text-success" : diff < 0 ? "text-error" : "text-text-tertiary"}`}>
                      {diff > 0 ? "+" : ""}{diff}%
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 text-xs text-text-tertiary mt-2">
                <div className="w-40" />
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <div className="w-3 h-2 bg-text-tertiary/40 rounded" />
                    <span>Pre</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="w-3 h-2 bg-primary rounded" />
                    <span>Post</span>
                  </div>
                </div>
                <div className="w-14" />
              </div>
            </div>
          </div>
        )}

        {/* Next Steps — Smart Level Routing */}
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            What&apos;s Next?
          </h2>

          {/* Pre-Assessment: Show per-category recommendations */}
          {sessionType === "pre" && (() => {
            const categories = getCategoryScores(moduleBreakdown);
            const weakCategories = categories.filter((c) => c.score < MASTERY_THRESHOLDS.PASSING);
            const allStrong = weakCategories.length === 0;

            return (
              <>
                <p className="text-text-secondary mb-4">
                  {allStrong
                    ? "Great news! You scored well across all areas. You can start from the beginning or jump into any module."
                    : "Based on your pre-assessment, here are your recommended focus areas:"}
                </p>

                {/* Category status list */}
                <div className="space-y-2 mb-6">
                  {categories.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cat.score >= MASTERY_THRESHOLDS.PASSING ? "text-success" : "text-warning"}>
                          {cat.score >= MASTERY_THRESHOLDS.PASSING ? "✓" : "→"}
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${cat.score >= MASTERY_THRESHOLDS.PASSING ? "text-success" : "text-warning"}`}>
                          {cat.score}%
                        </span>
                        {cat.score < MASTERY_THRESHOLDS.PASSING && (
                          <button
                            onClick={() => router.push(`/app/learn/${cat.moduleId}`)}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Start here
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {weakCategories.length > 0 && (
                  <p className="text-sm text-text-tertiary mb-4">
                    We recommend starting with{" "}
                    <strong>{weakCategories[0].name}</strong> — your area with
                    the most room for growth.
                  </p>
                )}
              </>
            );
          })()}

          {/* Post-Assessment: Show category-specific feedback */}
          {sessionType === "post" && (() => {
            const categories = getCategoryScores(moduleBreakdown);
            const weakCategories = categories.filter((c) => c.score < MASTERY_THRESHOLDS.PASSING);
            const allMastered = weakCategories.length === 0;

            return (
              <>
                <p className="text-text-secondary mb-4">
                  {allMastered
                    ? "You have mastered all categories! You have completed the ATAL AI digital literacy curriculum."
                    : "You have made progress! Here are the areas to revisit for further improvement:"}
                </p>

                {/* Category feedback list */}
                <div className="space-y-2 mb-6">
                  {categories.map((cat) => {
                    const preModule = comparisonData?.pre?.modules?.[cat.category];
                    const preScore = preModule?.score != null ? Math.round(preModule.score) : null;
                    const improved = preScore != null && cat.score > preScore;

                    return (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cat.score >= MASTERY_THRESHOLDS.PASSING ? "text-success" : "text-warning"}>
                            {cat.score >= MASTERY_THRESHOLDS.PASSING ? "✓" : "!"}
                          </span>
                          <span className="text-sm font-medium text-text-primary">
                            {cat.name}
                          </span>
                          {improved && (
                            <span className="text-xs text-success font-medium">
                              +{cat.score - (preScore ?? 0)}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${cat.score >= MASTERY_THRESHOLDS.PASSING ? "text-success" : "text-warning"}`}>
                            {cat.score}%
                          </span>
                          {cat.score < MASTERY_THRESHOLDS.PASSING && (
                            <button
                              onClick={() => router.push(`/app/learn/${cat.moduleId}`)}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Revisit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {allMastered && (
                  <div className="text-center p-4 bg-success/10 rounded-lg mb-4">
                    <span className="text-3xl block mb-1">🎓</span>
                    <p className="text-sm font-semibold text-success">Curriculum Mastery Achieved!</p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Adaptive: Generic message */}
          {sessionType === "adaptive" && (
            <p className="text-text-secondary mb-6">
              Based on your assessment, we&apos;ve identified learning modules
              that will help you grow your digital literacy skills.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {sessionType === "pre" && (() => {
              const weakestModuleId = getWeakestModule(moduleBreakdown);
              const allStrong = getCategoryScores(moduleBreakdown).every((c) => c.score >= MASTERY_THRESHOLDS.PASSING);
              return (
                <Button
                  onClick={() => router.push(weakestModuleId && !allStrong ? `/app/learn/${weakestModuleId}` : "/app/learn")}
                  size="lg"
                  className="flex-1"
                >
                  {allStrong ? "Start Learning" : "Start with Recommended Module"}
                </Button>
              );
            })()}
            {sessionType === "post" && (() => {
              const weakestModuleId = getWeakestModule(moduleBreakdown);
              const allMastered = getCategoryScores(moduleBreakdown).every((c) => c.score >= MASTERY_THRESHOLDS.PASSING);
              return (
                <Button
                  onClick={() => router.push(weakestModuleId && !allMastered ? `/app/learn/${weakestModuleId}` : "/app/learn")}
                  size="lg"
                  className="flex-1"
                >
                  {allMastered ? "Continue Exploring" : "Revisit Weak Areas"}
                </Button>
              );
            })()}
            {sessionType === "adaptive" && (
              <Button
                onClick={() => router.push("/app/learn")}
                size="lg"
                className="flex-1"
              >
                Continue Learning
              </Button>
            )}
            {sessionType !== "post" && (
              <Button
                onClick={() => router.push("/app/assessment/start")}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Retake Assessment
              </Button>
            )}
            <Button
              onClick={() => router.push("/app/dashboard")}
              variant="ghost"
              size="lg"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
