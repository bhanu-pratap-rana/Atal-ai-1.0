"use client";

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

interface AssessmentStatsProps {
  readonly avgResponseTime: number;
  readonly moduleBreakdown: Record<string, { total: number; correct: number }>;
  readonly irtData?: IRTData;
}

/**
 * Format time display
 */
function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function AssessmentStats({
  avgResponseTime,
  moduleBreakdown,
  irtData,
}: AssessmentStatsProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Response Time */}
        <div className="bg-primary-light p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary-dark">
            {formatTime(avgResponseTime)}
          </div>
          <div className="text-xs text-primary/80">
            Avg. Response Time
          </div>
        </div>

        {/* Modules Covered */}
        <div className="bg-success-light p-4 rounded-lg">
          <div className="text-2xl font-bold text-success-dark">
            {Object.keys(moduleBreakdown).length}
          </div>
          <div className="text-xs text-success/80">Modules Covered</div>
        </div>
      </div>

      {/* IRT-Enhanced Stats */}
      {irtData && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            Ability Estimate (IRT)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary-light p-3 rounded-lg">
              <div className="text-xl font-bold text-secondary-dark">
                θ = {irtData.theta.toFixed(2)}
              </div>
              <div className="text-xs text-secondary/80">
                Ability Score
              </div>
            </div>
            <div className="bg-warning-light p-3 rounded-lg">
              <div className="text-xl font-bold text-warning-dark">
                ±{irtData.standardError.toFixed(2)}
              </div>
              <div className="text-xs text-warning/80">
                Standard Error
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-tertiary text-center">
            Your ability level:{" "}
            <span className="font-semibold">
              {irtData.proficiencyLevel}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
