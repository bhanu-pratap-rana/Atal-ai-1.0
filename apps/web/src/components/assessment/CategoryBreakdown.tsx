"use client";


/**
 * ATAL AI Assessment Category Breakdown - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 *
 * Features:
 * - Per-module/category performance bars
 * - Category icons
 * - Correct/total count display
 */

interface CategoryData {
  name: string;
  correct: number;
  total: number;
}

interface CategoryBreakdownProps {
  readonly categories: Record<string, { total: number; correct: number }>;
  /** Custom class name */
  readonly className?: string;
}

// Category display names and icons
const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  "digital-device-familiarity": { label: "Digital Devices", icon: "💻" },
  "internet-web-awareness": { label: "Internet & Web", icon: "🌐" },
  "digital-content-creation": { label: "Content Creation", icon: "🎨" },
  "problem-solving-aptitude": { label: "Problem Solving", icon: "🧩" },
  "contextual-application": { label: "Application", icon: "🎯" },
  // Fallback for unknown categories
  default: { label: "General", icon: "📝" },
};

const getCategoryConfig = (key: string) => {
  return (
    CATEGORY_CONFIG[key] || {
      label: key.replaceAll("-", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase()),
      icon: "📝",
    }
  );
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 80) return "[&::-webkit-progress-value]:bg-success [&::-moz-progress-bar]:bg-success";
  if (percentage >= 60) return "[&::-webkit-progress-value]:bg-warning [&::-moz-progress-bar]:bg-warning";
  return "[&::-webkit-progress-value]:bg-error [&::-moz-progress-bar]:bg-error";
};

const getPercentageTextColor = (percentage: number) => {
  if (percentage >= 80) return "text-success";
  if (percentage >= 60) return "text-warning";
  return "text-error";
};

const getCategoryBadgeStyle = (type: "strengths" | "weaknesses") => {
  if (type === "strengths") return "bg-success-light text-success-dark";
  return "bg-warning-light text-warning-dark";
};

export function CategoryBreakdown({
  categories,
  className = "",
}: CategoryBreakdownProps) {
  // Convert categories object to sorted array
  const categoryList: CategoryData[] = Object.entries(categories)
    .map(([key, value]) => ({
      name: key,
      correct: value.correct,
      total: value.total,
    }))
    .sort((a, b) => {
      // Sort by percentage (descending)
      const pctA = a.total > 0 ? (a.correct / a.total) * 100 : 0;
      const pctB = b.total > 0 ? (b.correct / b.total) * 100 : 0;
      return pctB - pctA;
    });

  if (categoryList.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary">
        Category Performance
      </h3>

      <div className="space-y-4">
        {categoryList.map(({ name, correct, total }) => {
          const config = getCategoryConfig(name);
          const percentage =
            total > 0 ? Math.round((correct / total) * 100) : 0;

          return (
            <div key={name} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {config.icon}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    {correct}/{total}
                  </span>
                  <span
                    className={`text-sm font-semibold ${getPercentageTextColor(percentage)}`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <progress
                className={`w-full h-2 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:rounded-full ${getProgressBarColor(percentage)}`}
                value={percentage}
                max={100}
                aria-label={`${config.label}: ${percentage}%`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact category list for displaying strengths/weaknesses
 */
export function CategoryStrengths({
  categories,
  type = "strengths",
}: Readonly<{
  categories: Record<string, { total: number; correct: number }>;
  type?: "strengths" | "weaknesses";
}>) {
  const categoryList = Object.entries(categories)
    .map(([key, value]) => ({
      name: key,
      percentage: value.total > 0 ? (value.correct / value.total) * 100 : 0,
    }))
    .sort((a, b) =>
      type === "strengths"
        ? b.percentage - a.percentage
        : a.percentage - b.percentage,
    )
    .slice(0, 2); // Top 2 categories

  const title = type === "strengths" ? "Your Strengths" : "Areas to Improve";
  const icon = type === "strengths" ? "💪" : "📚";

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {categoryList.map(({ name, percentage }) => {
          const config = getCategoryConfig(name);
          return (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getCategoryBadgeStyle(type)}`}
            >
              <span aria-hidden="true">{config.icon}</span>
              {config.label}
              <span className="text-xs opacity-80">
                ({Math.round(percentage)}%)
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
