/**
 * Learning Style Card Component
 *
 * Displays a single learning style score with visual indicator.
 * Used in the Learning Style Profile dashboard.
 */

import { Card, CardContent } from "@/components/ui/card";

interface LearningStyleCardProps {
  style: "visual" | "text" | "auditory";
  score: number;
  isActive: boolean;
  icon: string;
  title: string;
  activityCount: number;
  activityLabel: string;
}

// Style-specific gradient colors
const STYLE_COLORS = {
  visual: {
    gradient: "from-info to-info/80",
    bg: "bg-info/5",
    border: "border-info/30",
    text: "text-info",
    bar: "bg-info",
  },
  text: {
    gradient: "from-success to-success/80",
    bg: "bg-success/5",
    border: "border-success/30",
    text: "text-success",
    bar: "bg-success",
  },
  auditory: {
    gradient: "from-secondary to-secondary/80",
    bg: "bg-secondary/5",
    border: "border-secondary/30",
    text: "text-secondary",
    bar: "bg-secondary",
  },
};

export function LearningStyleCard({
  style,
  score,
  isActive,
  icon,
  title,
  activityCount,
  activityLabel,
}: LearningStyleCardProps) {
  const colors = STYLE_COLORS[style];

  return (
    <Card
      className={`card-responsive transition-all duration-300 ${
        isActive
          ? `${colors.bg} ${colors.border} border-2 shadow-lg scale-[1.02]`
          : "bg-surface border-border-light hover:border-border"
      }`}
    >
      <CardContent className="pt-6">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className={`font-semibold ${isActive ? colors.text : "text-text-primary"}`}>
              {title}
            </h3>
            {isActive && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Dominant
              </span>
            )}
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-secondary">Score</span>
            <span className={`text-2xl font-bold ${isActive ? colors.text : "text-text-primary"}`}>
              {score}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Activity Stat */}
        <div className="pt-3 border-t border-border-light">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">{activityLabel}</span>
            <span className={`font-medium ${isActive ? colors.text : "text-text-secondary"}`}>
              {activityCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
