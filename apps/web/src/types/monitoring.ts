/**
 * Monitoring Types
 * Shared types for query performance and connection pool monitoring
 */

/**
 * Query Performance Metric
 */
export interface QueryMetric {
  queryName: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  tableNames?: string[];
  success: boolean;
  error?: string;
}

/**
 * Query Performance Statistics
 */
export interface QueryStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  slowQueries: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
}

/**
 * Connection Pool Metrics
 */
export interface ConnectionPoolMetrics {
  activeConnections: number;
  maxConnections: number;
  utilizationPercent: number;
  timestamp: Date;
}

/**
 * Connection Pool Alert
 */
export interface PoolAlert {
  level: "warning" | "error" | "critical";
  message: string;
  metrics: ConnectionPoolMetrics;
  timestamp: Date;
}

/**
 * Monitoring Alert Thresholds
 */
export const MONITORING_THRESHOLDS = {
  SLOW_QUERY: 1000, // 1 second - warning level
  VERY_SLOW_QUERY: 3000, // 3 seconds - error level
  CRITICAL_QUERY: 5000, // 5 seconds - critical level
  POOL_WARNING: 70, // 70% utilization
  POOL_ERROR: 85, // 85% utilization
  POOL_CRITICAL: 95, // 95% utilization
} as const;

/**
 * Monitoring Configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  trackSlowQueries: boolean;
  trackFailedQueries: boolean;
  trackConnectionPool: boolean;
  sendSentryAlerts: boolean;
  slowQueryThreshold: number;
  verySlowQueryThreshold: number;
  criticalQueryThreshold: number;
  poolWarningThreshold: number;
  poolErrorThreshold: number;
  poolCriticalThreshold: number;
  maxMetricsStored: number;
  metricsCheckInterval: number;
}

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  trackSlowQueries: true,
  trackFailedQueries: true,
  trackConnectionPool: true,
  sendSentryAlerts: true,
  slowQueryThreshold: MONITORING_THRESHOLDS.SLOW_QUERY,
  verySlowQueryThreshold: MONITORING_THRESHOLDS.VERY_SLOW_QUERY,
  criticalQueryThreshold: MONITORING_THRESHOLDS.CRITICAL_QUERY,
  poolWarningThreshold: MONITORING_THRESHOLDS.POOL_WARNING,
  poolErrorThreshold: MONITORING_THRESHOLDS.POOL_ERROR,
  poolCriticalThreshold: MONITORING_THRESHOLDS.POOL_CRITICAL,
  maxMetricsStored: 1000,
  metricsCheckInterval: 5000,
};
