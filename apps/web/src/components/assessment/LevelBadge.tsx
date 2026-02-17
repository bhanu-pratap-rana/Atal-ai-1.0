"use client";

/**
 * ATAL AI Assessment Level Badge - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 *
 * Features:
 * - Beginner / Intermediate / Advanced levels
 * - Icon indicators
 * - Based on score thresholds
 */

type SkillLevel = "beginner" | "intermediate" | "advanced";

interface LevelBadgeProps {
  /** Score percentage (0-100) to determine level */
  readonly score?: number;
  /** Direct level specification (overrides score) */
  readonly level?: SkillLevel;
  /** Size variant */
  readonly size?: "sm" | "md" | "lg";
  /** Custom class name */
  readonly className?: string;
}

const LEVEL_CONFIG: Record<
  SkillLevel,
  {
    label: string;
    icon: string;
    description: string;
    colorClass: string;
    bgClass: string;
  }
> = {
  beginner: {
    label: "Beginner",
    icon: "🌱",
    description: "Just starting your digital journey",
    colorClass: "text-primary",
    bgClass: "bg-primary-light",
  },
  intermediate: {
    label: "Intermediate",
    icon: "🌿",
    description: "Growing your digital skills",
    colorClass: "text-success",
    bgClass: "bg-success-light",
  },
  advanced: {
    label: "Advanced",
    icon: "🌳",
    description: "Mastering digital literacy",
    colorClass: "text-cyan",
    bgClass: "bg-cyan-light",
  },
};

/**
 * Determine skill level from percentage score
 * Thresholds: <50% Beginner, 50-79% Intermediate, ≥80% Advanced
 */
const getLevelFromScore = (score: number): SkillLevel => {
  if (score >= 80) return "advanced";
  if (score >= 50) return "intermediate";
  return "beginner";
};

/**
 * Get progress bar color based on skill level
 */
function getProgressBarColor(level: SkillLevel): string {
  switch (level) {
    case "beginner":
      return "var(--color-primary)";
    case "intermediate":
      return "var(--color-success)";
    case "advanced":
      return "var(--color-cyan)";
  }
}

/**
 * Determine skill level from score or explicit level prop
 */
function getSkillLevel(
  level: SkillLevel | undefined,
  score: number | undefined,
): SkillLevel {
  if (level) return level;
  if (score !== undefined) return getLevelFromScore(score);
  return "beginner";
}

/**
 * Get badge classes for level progression display
 */
function getLevelBadgeClasses(
  isActive: boolean,
  isCurrent: boolean,
  bgClass: string,
): string {
  if (isCurrent) {
    return `${bgClass} ring-2 ring-offset-2 ring-current`;
  }
  if (isActive) {
    return bgClass;
  }
  return "bg-border";
}

export function LevelBadge({
  score,
  level,
  size = "md",
  className = "",
}: LevelBadgeProps) {
  // Determine level from score or prop
  const skillLevel = getSkillLevel(level, score);
  const config = LEVEL_CONFIG[skillLevel];

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const iconSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <output
      className={`
        inline-flex items-center gap-2 rounded-full font-semibold
        ${config.bgClass} ${config.colorClass}
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={`Skill level: ${config.label}`}
    >
      <span className={iconSizes[size]} aria-hidden="true">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </output>
  );
}

/**
 * Expanded level display with description
 */
export function LevelCard({
  score,
  level,
  className = "",
}: Readonly<Omit<LevelBadgeProps, "size">>) {
  const skillLevel = getSkillLevel(level, score);
  const config = LEVEL_CONFIG[skillLevel];

  return (
    <div
      className={`
        rounded-xl p-4 text-center
        ${config.bgClass}
        ${className}
      `}
    >
      <div className="text-4xl mb-2" aria-hidden="true">
        {config.icon}
      </div>
      <h3 className={`text-lg font-bold ${config.colorClass}`}>
        {config.label}
      </h3>
      <p className="text-sm text-text-secondary mt-1">{config.description}</p>
    </div>
  );
}

/**
 * Level progress indicator showing all three levels
 */
export function LevelProgress({
  score,
  className = "",
}: Readonly<{
  score: number;
  className?: string;
}>) {
  const currentLevel = getLevelFromScore(score);

  const levels: SkillLevel[] = ["beginner", "intermediate", "advanced"];
  const currentIndex = levels.indexOf(currentLevel);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {levels.map((level, index) => {
          const config = LEVEL_CONFIG[level];
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={level}
              className={`
                flex flex-col items-center gap-1
                ${isActive ? config.colorClass : "text-text-muted"}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xl
                  transition-all duration-300
                  ${getLevelBadgeClasses(isActive, isCurrent, config.bgClass)}
                `}
              >
                {config.icon}
              </div>
              <span className="text-xs font-medium">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Progress line */}
      <div className="relative h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            ${LEVEL_CONFIG[currentLevel].bgClass.replaceAll("-light", "")}
          `}
          style={{
            width: `${Math.min(100, Math.max(0, (currentIndex + 1) * 33.33))}%`,
            backgroundColor: getProgressBarColor(currentLevel),
          }}
        />
      </div>
    </div>
  );
}

// Export utility function for external use
export { getLevelFromScore };
