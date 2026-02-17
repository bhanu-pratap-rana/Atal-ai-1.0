/**
 * StatisticsDashboard Component
 * Displays statistics about schools and PINs
 */

import type { PINStatistics } from "@/app/actions/admin-pin-management";

interface StatisticsDashboardProps {
  readonly stats: PINStatistics | null;
}

export function StatisticsDashboard({ stats }: StatisticsDashboardProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Total Schools */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-sm text-text-secondary mb-2">Total Schools</p>
        <p className="text-3xl font-bold text-primary">{stats.totalSchools}</p>
      </div>

      {/* Schools with PIN */}
      <div className="bg-white border border-border rounded-lg p-4 border-l-4 border-l-success">
        <p className="text-sm text-text-secondary mb-2">With PIN</p>
        <p className="text-3xl font-bold text-success">
          {stats.schoolsWithPINs}
        </p>
        <p className="text-xs text-text-secondary mt-2">
          {Math.round((stats.schoolsWithPINs / stats.totalSchools) * 100)}%
        </p>
      </div>

      {/* Schools without PIN */}
      <div className="bg-white border border-border rounded-lg p-4 border-l-4 border-l-warning">
        <p className="text-sm text-text-secondary mb-2">Without PIN</p>
        <p className="text-3xl font-bold text-warning">
          {stats.totalSchools - stats.schoolsWithPINs}
        </p>
        <p className="text-xs text-text-secondary mt-2">
          {Math.round(
            ((stats.totalSchools - stats.schoolsWithPINs) / stats.totalSchools) *
              100,
          )}
          %
        </p>
      </div>
    </div>
  );
}
