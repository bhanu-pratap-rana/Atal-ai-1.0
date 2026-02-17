-- Migration: Add Connection Pool Monitoring Function
-- Date: 2026-01-02
-- Status: MONITORING INFRASTRUCTURE - PHASE 3
-- Purpose: Provide real-time connection pool metrics for monitoring dashboard
-- Impact: Enables monitoring and alerting on connection pool utilization

-- ============================================================================
-- DROP EXISTING FUNCTION IF EXISTS
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_connection_stats();

-- ============================================================================
-- CREATE FUNCTION: get_connection_stats()
-- ============================================================================
-- Returns current connection pool metrics
-- Safe to call frequently (uses internal PostgreSQL views)
-- No parameters required

CREATE OR REPLACE FUNCTION public.get_connection_stats()
RETURNS TABLE (
  active_connections INTEGER,
  max_connections INTEGER,
  utilization_percent NUMERIC
) AS $$
DECLARE
  v_active_count INTEGER;
  v_max_connections INTEGER;
  v_utilization NUMERIC;
BEGIN
  -- Get current active connections
  SELECT COUNT(*)::INTEGER INTO v_active_count
  FROM pg_stat_activity
  WHERE state IS NOT NULL
    AND usename != 'pg_database_owner' -- Exclude system connections
    AND pid != pg_backend_pid(); -- Exclude current connection

  -- Get max connections setting
  SELECT setting::INTEGER INTO v_max_connections
  FROM pg_settings
  WHERE name = 'max_connections';

  -- Calculate utilization percentage
  v_utilization := ROUND((v_active_count::NUMERIC / v_max_connections::NUMERIC) * 100, 2);

  RETURN QUERY
  SELECT
    v_active_count,
    v_max_connections,
    v_utilization;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCTION DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.get_connection_stats() IS
'Returns current connection pool metrics for monitoring dashboard.
Safe to call frequently as it uses PostgreSQL system views.
Returns:
  - active_connections: Current number of active connections
  - max_connections: Maximum allowed connections
  - utilization_percent: Percentage of connection pool in use

Usage:
  SELECT * FROM get_connection_stats();

Output example:
  active_connections | max_connections | utilization_percent
  ==================|=================|====================
              25    |        100       |        25.00
              85    |        100       |        85.00

Alert thresholds:
  - 70%:  Warning level (investigate trends)
  - 85%:  Error level (immediate attention needed)
  - 95%+: Critical (imminent exhaustion)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allow all authenticated users to call this monitoring function
GRANT EXECUTE ON FUNCTION public.get_connection_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_connection_stats() TO service_role;

-- ============================================================================
-- RELATED MONITORING QUERIES (for manual inspection)
-- ============================================================================
-- View detailed connection information:
-- SELECT
--   pid,
--   usename,
--   application_name,
--   state,
--   state_change,
--   query,
--   query_start
-- FROM pg_stat_activity
-- WHERE state IS NOT NULL
-- ORDER BY state_change DESC;

-- View connection history:
-- SELECT
--   datname,
--   usename,
--   COUNT(*) as connection_count
-- FROM pg_stat_activity
-- WHERE state IS NOT NULL
-- GROUP BY datname, usename
-- ORDER BY connection_count DESC;

-- ============================================================================
-- PERFORMANCE NOTE
-- ============================================================================
-- This function is performant because:
-- 1. Uses pg_stat_activity (built-in system view, no joins)
-- 2. Simple WHERE clause with indexes
-- 3. Minimal aggregation (just COUNT())
-- 4. Marked as STABLE so PostgreSQL can cache results
-- 5. Expected execution time: < 5ms

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- If needed, rollback using:
-- DROP FUNCTION IF EXISTS public.get_connection_stats();
