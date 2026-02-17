"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { queryMonitor } from "@/lib/supabase-query-wrapper";
import { connectionPoolMonitor } from "@/lib/monitoring/connection-pool-monitor";
import type { ConnectionPoolMetrics, PoolAlert } from "@/types/monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingDown, Zap } from "lucide-react";

/**
 * Helper: Get alert styling based on severity level
 */
function getAlertClassName(level: string): string {
  switch (level) {
    case "critical":
      return "border-error bg-error/10 text-error";
    case "error":
      return "border-accent bg-accent/10 text-accent";
    default:
      return "border-warning bg-warning/10 text-warning";
  }
}

/**
 * Utilization color info based on percentage
 */
interface UtilizationColors {
  readonly textClass: string;
  readonly barClass: string;
}

/**
 * Get utilization colors based on percentage threshold
 */
function getUtilizationColors(percent: number): UtilizationColors {
  if (percent > 85) {
    return { textClass: "text-error", barClass: "bg-error" };
  }
  if (percent > 70) {
    return { textClass: "text-accent", barClass: "bg-accent" };
  }
  return { textClass: "text-success", barClass: "bg-success" };
}

export default function PerformanceMonitoringPage() {
  const [stats, setStats] = useState(queryMonitor.getStats());
  const [slowQueries, setSlowQueries] = useState(
    queryMonitor.getSlowestQueries(10),
  );
  const [failedQueries, setFailedQueries] = useState(
    queryMonitor.getFailedQueries(10),
  );
  const [poolMetrics, setPoolMetrics] = useState<ConnectionPoolMetrics | null>(
    null,
  );
  const [poolAlerts, setPoolAlerts] = useState<PoolAlert[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Update query stats
      setStats(queryMonitor.getStats());
      setSlowQueries(queryMonitor.getSlowestQueries(10));
      setFailedQueries(queryMonitor.getFailedQueries(10));

      // Check connection pool
      const metrics = await connectionPoolMonitor.getMetrics();
      if (metrics) {
        setPoolMetrics(metrics);
      }

      const alert = await connectionPoolMonitor.checkHealth();
      if (alert) {
        setPoolAlerts(connectionPoolMonitor.getRecentAlerts(10));
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Database Performance Monitoring</h1>
        <div className="text-sm text-text-tertiary">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Query Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Total Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalQueries}</div>
            <p className="text-xs text-text-tertiary mt-2">
              {stats.successfulQueries} success, {stats.failedQueries} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Slow Queries (&gt;1s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {stats.slowQueries}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              {(
                (stats.slowQueries / Math.max(stats.totalQueries, 1)) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.avgDuration.toFixed(0)}ms
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              P95: {stats.p95Duration.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              P99 Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-error">
              {stats.p99Duration.toFixed(0)}ms
            </div>
            <p className="text-xs text-text-tertiary mt-2">Slowest 1% of queries</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Pool Stats */}
      {poolMetrics && (
        <Card className="border-info/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Connection Pool Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-text-secondary mb-2">Active Connections</p>
                <p className="text-2xl font-bold">
                  {poolMetrics.activeConnections}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Max Connections</p>
                <p className="text-2xl font-bold">
                  {poolMetrics.maxConnections}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Utilization</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-2xl font-bold ${getUtilizationColors(poolMetrics.utilizationPercent).textClass}`}
                  >
                    {poolMetrics.utilizationPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Pool Utilization Bar */}
            <div className="mt-6">
              <div className="h-3 bg-surface-dark rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getUtilizationColors(poolMetrics.utilizationPercent).barClass}`}
                  style={{ width: `${poolMetrics.utilizationPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pool Alerts */}
      {poolAlerts.length > 0 && (
        <Card className="border-error/30 bg-error/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5" />
              Connection Pool Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poolAlerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={`pool-alert-${idx}-${alert.timestamp}`}
                  className={`p-3 rounded border-l-4 ${getAlertClassName(alert.level)}`}
                >
                  <p className="font-semibold text-sm">{alert.message}</p>
                  <p className="text-xs mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Queries Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-accent" />
            Slowest Queries (&gt; 1 second)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slowQueries.length === 0 ? (
            <p className="text-success font-semibold">
              ✅ No slow queries detected
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {slowQueries.map((query, idx) => (
                <div
                  key={`slow-query-${idx}-${query.queryName}`}
                  className="border-l-4 border-accent pl-4 py-3 bg-accent/5 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{query.queryName}</p>
                      {query.tableNames && query.tableNames.length > 0 && (
                        <p className="text-xs text-text-secondary mt-1">
                          Tables: {query.tableNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="text-error font-bold text-sm">
                      {query.duration.toFixed(0)}ms
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    {new Date(query.timestamp).toLocaleString()}
                  </p>
                  {query.userId && (
                    <p className="text-xs text-text-secondary">
                      User: {query.userId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Queries Log */}
      {failedQueries.length > 0 && (
        <Card className="border-error/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5" />
              Failed Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {failedQueries.map((query, idx) => (
                <div
                  key={`failed-query-${idx}-${query.queryName}`}
                  className="border-l-4 border-error pl-4 py-3 bg-error/10 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{query.queryName}</p>
                      {query.error && (
                        <p className="text-xs text-error mt-1">
                          {query.error}
                        </p>
                      )}
                    </div>
                    <span className="text-text-secondary text-xs">
                      {query.duration.toFixed(0)}ms
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    {new Date(query.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Control */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="refresh-interval-select"
                className="text-sm font-medium"
              >
                Refresh Interval
              </label>
              <select
                id="refresh-interval-select"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="mt-2 px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  queryMonitor.reset();
                  connectionPoolMonitor.clearAlerts();
                  setSlowQueries([]);
                  setFailedQueries([]);
                }}
                className="px-4 py-2 bg-text-secondary text-white rounded-md text-sm hover:bg-text-primary"
              >
                Clear Metrics
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
