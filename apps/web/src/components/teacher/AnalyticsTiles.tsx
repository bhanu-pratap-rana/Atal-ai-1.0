"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  
} from "@/components/ui/card";

interface AnalyticsTilesProps {
  readonly activeThisWeek: number;
  readonly avgMinutesPerDay: number;
  readonly atRiskCount: number;
}

/**
 * At-risk tile styling based on risk status
 */
interface AtRiskStyles {
  readonly cardClass: string;
  readonly descriptionClass: string;
  readonly iconBackgroundClass: string;
  readonly iconEmoji: string;
  readonly numberClass: string;
  readonly textClass: string;
  readonly statusMessage: string;
}

/**
 * Get all styling and text for the at-risk card based on count
 */
function getAtRiskStyles(atRiskCount: number): AtRiskStyles {
  const hasAtRiskStudents = atRiskCount > 0;

  return {
    cardClass: `border-2 ${hasAtRiskStudents ? "border-warning/40 bg-gradient-to-br from-warning/10 to-warning/5" : "border-border bg-gradient-to-br from-surface to-surface-dark"}`,
    descriptionClass: hasAtRiskStudents
      ? "text-warning-dark font-medium"
      : "text-text-primary font-medium",
    iconBackgroundClass: hasAtRiskStudents ? "bg-warning" : "bg-text-tertiary",
    iconEmoji: hasAtRiskStudents ? "⚠️" : "✅",
    numberClass: hasAtRiskStudents
      ? "text-warning-dark"
      : "text-text-primary",
    textClass: hasAtRiskStudents ? "text-warning" : "text-text-secondary",
    statusMessage: hasAtRiskStudents
      ? "with mastery below 40%"
      : "All students engaged",
  };
}

export function AnalyticsTiles({
  activeThisWeek,
  avgMinutesPerDay,
  atRiskCount,
}: AnalyticsTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Active This Week */}
      <Card className="border-2 border-success/30 bg-gradient-to-br from-success-light to-success/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-success font-medium">
              Active This Week
            </CardDescription>
            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-success">
              {activeThisWeek}
            </div>
            <p className="text-sm text-success/80">
              {activeThisWeek === 1 ? "student" : "students"} active this
              week
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Avg Minutes Per Day */}
      <Card className="border-2 border-cyan/30 bg-gradient-to-br from-cyan-lightest to-cyan/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-cyan-dark font-medium">
              Avg Minutes/Day
            </CardDescription>
            <div className="w-10 h-10 bg-cyan rounded-full flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-cyan-dark">
              {avgMinutesPerDay.toFixed(1)}
            </div>
            <p className="text-sm text-cyan">minutes per student per day</p>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      {(() => {
        const styles = getAtRiskStyles(atRiskCount);
        return (
          <Card className={styles.cardClass}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className={styles.descriptionClass}>
                  At-Risk Students
                </CardDescription>
                <div
                  className={`w-10 h-10 ${styles.iconBackgroundClass} rounded-full flex items-center justify-center`}
                >
                  <span className="text-2xl">{styles.iconEmoji}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className={`text-4xl font-bold ${styles.numberClass}`}>
                  {atRiskCount}
                </div>
                <p className={`text-sm ${styles.textClass}`}>
                  {styles.statusMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
