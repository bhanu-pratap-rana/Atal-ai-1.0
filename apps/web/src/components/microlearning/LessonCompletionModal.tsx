"use client";

/**
 * Lesson Completion Modal
 *
 * Shows personalized feedback after completing a lesson:
 * - Score with visual indicator
 * - Points earned and new badges
 * - Personalized message based on performance
 * - Action buttons for next steps
 *
 * Trilingual support: English, Hindi, Assamese
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, RotateCcw, Trophy, Star } from "lucide-react";
import type { SupportedLanguage } from "@/types/common";

interface CompletionData {
  readonly score: number;
  readonly status: "in_progress" | "mastered";
  readonly attempts: number;
  readonly pointsAwarded: number;
  readonly newBadges: Array<{ id: string; name_en: string }>;
}

interface LessonCompletionModalProps {
  readonly data: CompletionData;
  readonly topicName: string;
  readonly language: SupportedLanguage;
  readonly onContinue: () => void;
  readonly onReviewAgain: () => void;
}

/** Trilingual labels */
const LABELS = {
  title: {
    en: "Lesson Complete!",
    hi: "पाठ पूरा हुआ!",
    as: "পাঠ সম্পূৰ্ণ!",
  },
  score: {
    en: "Your Score",
    hi: "आपका स्कोर",
    as: "আপোনাৰ স্ক'ৰ",
  },
  points: {
    en: "Points Earned",
    hi: "अर्जित अंक",
    as: "অৰ্জিত পইণ্ট",
  },
  newBadge: {
    en: "New Badge!",
    hi: "नया बैज!",
    as: "নতুন বেজ!",
  },
  continue: {
    en: "Continue",
    hi: "जारी रखें",
    as: "আগবাঢ়ক",
  },
  reviewAgain: {
    en: "Review Again",
    hi: "फिर से पढ़ें",
    as: "পুনৰ পঢ়ক",
  },
  attempt: {
    en: "Attempt",
    hi: "प्रयास",
    as: "প্ৰচেষ্টা",
  },
} as const;

/**
 * Get a personalized message based on score, attempts, and language
 */
function getPersonalizedMessage(
  score: number,
  attempts: number,
  topicName: string,
  language: SupportedLanguage,
): string {
  if (score >= 90) {
    const messages = {
      en: attempts === 1
        ? `Excellent work! You mastered "${topicName}" on your first try!`
        : `Outstanding! You've achieved mastery of "${topicName}"!`,
      hi: attempts === 1
        ? `बहुत बढ़िया! आपने "${topicName}" को पहली बार में ही सीख लिया!`
        : `शानदार! आपने "${topicName}" में महारत हासिल कर ली!`,
      as: attempts === 1
        ? `অতি উত্তম! আপুনি "${topicName}" প্ৰথম চেষ্টাতে আয়ত্ত কৰিলে!`
        : `অসাধাৰণ! আপুনি "${topicName}" আয়ত্ত কৰিলে!`,
    };
    return messages[language];
  }

  if (score >= 70) {
    const messages = {
      en: `Well done! You've passed "${topicName}". Keep up the great work!`,
      hi: `बहुत अच्छा! आपने "${topicName}" पास कर लिया। ऐसे ही आगे बढ़ते रहें!`,
      as: `ভাল কৰিলে! আপুনি "${topicName}" পাছ কৰিলে। এনেদৰে আগবাঢ়ক!`,
    };
    return messages[language];
  }

  if (score >= 50) {
    const messages = {
      en: `Good effort on "${topicName}"! Review the content once more to strengthen your understanding.`,
      hi: `"${topicName}" पर अच्छा प्रयास! समझ मजबूत करने के लिए एक बार फिर पढ़ें।`,
      as: `"${topicName}"-ত ভাল প্ৰচেষ্টা! বুজাবুজি শক্তিশালী কৰিবলৈ আৰু এবাৰ পঢ়ক।`,
    };
    return messages[language];
  }

  const messages = {
    en: `Keep going! "${topicName}" takes practice. Try reviewing the lesson and attempting again.`,
    hi: `हिम्मत न हारें! "${topicName}" में अभ्यास जरूरी है। पाठ दोबारा पढ़कर प्रयास करें।`,
    as: `আগবাঢ়ক! "${topicName}"-ত অভ্যাস দৰকাৰ। পাঠটো পুনৰ পঢ়ি চেষ্টা কৰক।`,
  };
  return messages[language];
}

/**
 * Get emoji/icon based on score
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return "🏆";
  if (score >= 70) return "⭐";
  if (score >= 50) return "👍";
  return "💪";
}

export function LessonCompletionModal({
  data,
  topicName,
  language,
  onContinue,
  onReviewAgain,
}: LessonCompletionModalProps) {
  const { score, attempts, pointsAwarded, newBadges } = data;
  const isPassing = score >= 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2">{getScoreEmoji(score)}</div>
          <CardTitle className="text-2xl">
            {LABELS.title[language]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Score */}
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-1">
              {LABELS.score[language]}
            </p>
            <div className="text-5xl font-bold mb-2">
              {score}%
            </div>
            <Progress
              value={score}
              className={`h-3 ${isPassing ? "[&>div]:bg-success" : "[&>div]:bg-warning"}`}
            />
            <p className="text-xs text-text-secondary mt-1">
              {LABELS.attempt[language]} #{attempts}
            </p>
          </div>

          {/* Personalized message */}
          <p className="text-center text-sm leading-relaxed">
            {getPersonalizedMessage(score, attempts, topicName, language)}
          </p>

          {/* Points */}
          {pointsAwarded > 0 && (
            <div className="flex items-center justify-center gap-2 bg-warning/10 rounded-lg p-3">
              <Star className="h-5 w-5 text-warning" />
              <span className="font-semibold">
                +{pointsAwarded} {LABELS.points[language]}
              </span>
            </div>
          )}

          {/* Badges */}
          {newBadges.length > 0 && (
            <div className="space-y-2">
              {newBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-3"
                >
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {LABELS.newBadge[language]} {badge.name_en}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onReviewAgain}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {LABELS.reviewAgain[language]}
            </Button>
            <Button
              onClick={onContinue}
              className={`flex-1 ${isPassing ? "bg-success hover:bg-success/90" : ""}`}
            >
              {isPassing ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-1" />
              )}
              {LABELS.continue[language]}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
