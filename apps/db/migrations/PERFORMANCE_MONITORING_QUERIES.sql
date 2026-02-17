-- ============================================================================
-- Performance Monitoring Queries for Migration 128
-- ============================================================================
-- Use these queries to monitor index usage and query performance after
-- deploying migration 128_add_missing_indexes.sql
-- ============================================================================

-- ============================================================================
-- 1. INDEX USAGE STATISTICS
-- ============================================================================

-- Check if new indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as total_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ NOT USED YET'
    WHEN idx_scan < 10 THEN '⚠️ LOW USAGE'
    ELSE '✅ IN USE'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  )
ORDER BY idx_scan DESC, tablename, indexname;

-- ============================================================================
-- 2. QUERY PERFORMANCE ANALYSIS
-- ============================================================================

-- Test assessment response query (should use idx_assessment_responses_session_user)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  ar.id,
  ar.session_id,
  ar.user_id,
  ar.is_correct,
  ar.response
FROM assessment_responses ar
WHERE ar.session_id = (
  SELECT id FROM assessment_sessions LIMIT 1
)
AND ar.user_id = (
  SELECT user_id FROM assessment_sessions LIMIT 1
)
LIMIT 10;

-- Test assessment session history (should use idx_assessment_sessions_user_time)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  user_id,
  started_at,
  submitted_at
FROM assessment_sessions
WHERE user_id = (
  SELECT user_id FROM assessment_sessions LIMIT 1
)
AND submitted_at IS NOT NULL
ORDER BY started_at DESC
LIMIT 20;

-- Test knowledge state query (should use idx_student_knowledge_state_student_module)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  student_id,
  module_id,
  mastery_score,
  status
FROM student_knowledge_state
WHERE student_id = (
  SELECT student_id FROM student_knowledge_state LIMIT 1
)
AND module_id = (
  SELECT module_id FROM student_knowledge_state LIMIT 1
);

-- ============================================================================
-- 3. INDEX SIZE MONITORING
-- ============================================================================

-- Check total size of new indexes
SELECT 
  pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size,
  COUNT(*) as index_count
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  );

-- Detailed size breakdown
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename::regclass)) as table_size,
  ROUND(
    100.0 * pg_relation_size(indexrelid) / 
    NULLIF(pg_relation_size(schemaname||'.'||tablename::regclass), 0),
    2
  ) as index_to_table_ratio
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 4. TABLE STATISTICS (for context)
-- ============================================================================

-- Check table sizes and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                 pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'assessment_responses',
    'assessment_sessions',
    'student_knowledge_state',
    'school_staff_credentials'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 5. SLOW QUERY DETECTION
-- ============================================================================

-- Check for sequential scans on indexed tables (should be rare)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE 
    WHEN seq_scan > idx_scan * 10 THEN '⚠️ TOO MANY SEQ SCANS'
    ELSE '✅ GOOD'
  END as status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'assessment_responses',
    'assessment_sessions',
    'student_knowledge_state',
    'school_staff_credentials'
  )
ORDER BY seq_scan DESC;

-- ============================================================================
-- 6. INDEX EFFICIENCY METRICS
-- ============================================================================

-- Calculate index efficiency (higher is better)
SELECT 
  indexname,
  idx_scan as total_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN 0
    ELSE ROUND(100.0 * idx_tup_fetch / NULLIF(idx_tup_read, 0), 2)
  END as efficiency_percent,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ NOT USED'
    WHEN idx_tup_fetch::float / NULLIF(idx_tup_read, 1) > 0.8 THEN '✅ EXCELLENT'
    WHEN idx_tup_fetch::float / NULLIF(idx_tup_read, 1) > 0.5 THEN '✅ GOOD'
    ELSE '⚠️ LOW EFFICIENCY'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  )
ORDER BY idx_scan DESC;

-- ============================================================================
-- 7. COMPARISON: BEFORE vs AFTER
-- ============================================================================

-- Run this query BEFORE migration to capture baseline
-- Then run again AFTER migration to compare

-- Assessment responses query time (baseline)
\timing on
SELECT COUNT(*) 
FROM assessment_responses 
WHERE session_id IN (
  SELECT id FROM assessment_sessions LIMIT 10
);
\timing off

-- Assessment sessions query time (baseline)
\timing on
SELECT COUNT(*) 
FROM assessment_sessions 
WHERE user_id IN (
  SELECT user_id FROM assessment_sessions LIMIT 10
)
AND submitted_at IS NOT NULL;
\timing off

-- ============================================================================
-- 8. INDEX MAINTENANCE
-- ============================================================================

-- Check for index bloat (run periodically)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as usage_count,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  )
ORDER BY idx_scan DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Run these queries regularly (daily/weekly) to monitor performance
-- 2. Index usage may be low initially - this is normal
-- 3. Indexes will be used more as data grows
-- 4. If idx_scan = 0 after 1 week, investigate query patterns
-- 5. Monitor index sizes - should remain stable
-- 6. Use EXPLAIN ANALYZE to verify index usage in production queries
--
-- ============================================================================

