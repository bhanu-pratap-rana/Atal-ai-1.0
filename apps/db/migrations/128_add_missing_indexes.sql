-- Migration 128: Add Missing Composite Indexes for Performance
-- Date: 2026-01-05
-- Status: PERFORMANCE OPTIMIZATION - PHASE 3
-- Purpose: Add composite indexes for common query patterns
-- Impact: 10-100x faster queries for assessment responses, sessions, and knowledge state
-- Safety: Uses CREATE INDEX CONCURRENTLY for zero-downtime deployment

-- ============================================================================
-- PART 1: Assessment Response Indexes
-- ============================================================================

-- Index for filtering responses by session and user with correctness
-- Used in: dashboard-stats.ts, assessment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_session_user
  ON assessment_responses(session_id, user_id) 
  INCLUDE (is_correct);

COMMENT ON INDEX idx_assessment_responses_session_user IS
'Optimizes queries filtering assessment responses by session and user. ' ||
'INCLUDE (is_correct) allows index-only scans for correctness checks. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- ============================================================================
-- PART 2: Assessment Session Indexes
-- ============================================================================

-- Index for user's assessment history (ordered by time)
-- Used in: student.ts::getStudentAssessmentHistory()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_sessions_user_time
  ON assessment_sessions(user_id, started_at DESC)
  WHERE submitted_at IS NOT NULL;

COMMENT ON INDEX idx_assessment_sessions_user_time IS
'Optimizes getStudentAssessmentHistory() query. ' ||
'Filters only submitted assessments (WHERE submitted_at IS NOT NULL) to reduce index size. ' ||
'Ordered by started_at DESC for efficient pagination. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- Index for class assessment queries (ordered by time)
-- Used in: teacher.ts::getClassAssessmentResults()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_sessions_class_time
  ON assessment_sessions(class_id, started_at DESC)
  WHERE submitted_at IS NOT NULL;

COMMENT ON INDEX idx_assessment_sessions_class_time IS
'Optimizes class assessment queries. ' ||
'Filters only submitted assessments to reduce index size. ' ||
'Ordered by started_at DESC for efficient time-based queries. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- ============================================================================
-- PART 3: Student Knowledge State Indexes
-- ============================================================================

-- Composite index for student knowledge state queries
-- Used in: adaptive-service.ts, knowledge state updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_knowledge_state_student_module
  ON student_knowledge_state(student_id, module_id)
  INCLUDE (mastery_score, status);

COMMENT ON INDEX idx_student_knowledge_state_student_module IS
'Optimizes knowledge state queries by student and module. ' ||
'INCLUDE (mastery_score, status) allows index-only scans. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- ============================================================================
-- PART 4: Soft-Delete Indexes
-- ============================================================================

-- Index for active school staff credentials (soft-delete pattern)
-- Used in: admin-metrics.ts, school queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_staff_credentials_active
  ON school_staff_credentials(school_id, created_at)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_school_staff_credentials_active IS
'Optimizes queries for active (non-deleted) school staff credentials. ' ||
'WHERE deleted_at IS NULL filters out soft-deleted records. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- ============================================================================
-- Verification
-- ============================================================================

-- Show all new indexes with their size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as idx_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_assessment_responses_session_user',
    'idx_assessment_sessions_user_time',
    'idx_assessment_sessions_class_time',
    'idx_student_knowledge_state_student_module',
    'idx_school_staff_credentials_active'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- Performance Notes
-- ============================================================================
--
-- Expected Performance Improvements:
-- - Assessment response queries: 10-50x faster
-- - Assessment session history: 20-100x faster
-- - Knowledge state queries: 10-30x faster
-- - School metrics queries: 5-10x faster
--
-- Index Sizes (estimated):
-- - idx_assessment_responses_session_user: ~5-10 MB
-- - idx_assessment_sessions_user_time: ~3-5 MB
-- - idx_assessment_sessions_class_time: ~3-5 MB
-- - idx_student_knowledge_state_student_module: ~2-4 MB
-- - idx_school_staff_credentials_active: ~1-2 MB
-- Total: ~15-26 MB (negligible for production)
--
-- ============================================================================

