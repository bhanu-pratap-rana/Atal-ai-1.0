-- Migration: Optimize Database Indexes
-- Date: 2026-01-02
-- Status: PERFORMANCE OPTIMIZATION - PHASE 1
-- Purpose: Add missing critical index + cleanup duplicate indexes
-- Impact: 10-20x faster student progress queries, zero-downtime deployment
-- Safety: Uses CREATE INDEX CONCURRENTLY and DROP INDEX CONCURRENTLY

-- ============================================================================
-- PART 1: Add Missing Critical Index
-- ============================================================================
-- Issue: No index on assessment_sessions(user_id, submitted_at DESC)
-- Impact: getStudentAssessmentHistory() performs full table scan
-- Performance Gain: 10-20x faster for students with 50+ assessments
-- Used in: apps/web/src/app/actions/student.ts::getStudentAssessmentHistory()
-- Priority: HIGH

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_sessions_user_submitted
ON public.assessment_sessions(user_id, submitted_at DESC)
WHERE submitted_at IS NOT NULL;

COMMENT ON INDEX idx_assessment_sessions_user_submitted IS
'Optimizes getStudentAssessmentHistory() query. Filters only submitted assessments (WHERE submitted_at IS NOT NULL) ' ||
'to reduce index size. Ordered by submitted_at DESC for efficient pagination. ' ||
'Created with CONCURRENTLY for zero-downtime deployment.';

-- ============================================================================
-- PART 2: Cleanup Duplicate Indexes
-- ============================================================================
-- Issue: Two indexes on teacher_profiles(school_id)
--   1. idx_teacher_profiles_school (Migration 008) - OLD, basic version
--   2. idx_teacher_profiles_school_id (Migration 037) - NEW, optimized version with WHERE clause
-- Resolution: Drop the older duplicate (Migration 008), keep the optimized one (Migration 037)
-- Benefit: Reduces index maintenance overhead, saves storage space

DROP INDEX CONCURRENTLY IF EXISTS idx_teacher_profiles_school;

COMMENT ON INDEX idx_teacher_profiles_school_id IS
'Optimizes teacher profile queries by school. Includes WHERE school_id IS NOT NULL for better selectivity. ' ||
'Replaces older idx_teacher_profiles_school from Migration 008. ' ||
'Used for: getAllTeachersInSchool(), getTeachersBySchool()';

-- ============================================================================
-- PART 3: Verification Query (Run manually after migration)
-- ============================================================================
-- Run this query to verify the migration applied successfully:
--
-- SELECT
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('assessment_sessions', 'teacher_profiles')
--   AND indexname IN (
--     'idx_assessment_sessions_user_submitted',
--     'idx_teacher_profiles_school_id',
--     'idx_teacher_profiles_school'
--   )
-- ORDER BY tablename, indexname;
--
-- Expected results:
-- - idx_assessment_sessions_user_submitted should exist
-- - idx_teacher_profiles_school_id should exist
-- - idx_teacher_profiles_school should NOT exist (deleted)
--
-- ============================================================================
-- PART 4: Index Usage Statistics Query
-- ============================================================================
-- Monitor index effectiveness (run after migration is in production):
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched,
--   ROUND((idx_tup_fetch::numeric / NULLIF(idx_tup_read, 0) * 100), 2) as efficiency_percent
-- FROM pg_stat_user_indexes
-- WHERE indexname IN (
--   'idx_assessment_sessions_user_submitted',
--   'idx_teacher_profiles_school_id'
-- )
-- ORDER BY idx_scan DESC;
--
-- Key Metrics:
-- - idx_scan: Number of times index was used (higher is better)
-- - efficiency_percent: Ratio of tuples fetched to read (higher = better selectivity)
-- - Target: idx_assessment_sessions_user_submitted should have 1000+ scans in production
--
-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================
-- To rollback this migration if issues arise:
--
-- -- 1. Drop the new index
-- DROP INDEX CONCURRENTLY IF EXISTS idx_assessment_sessions_user_submitted;
--
-- -- 2. Recreate the deleted duplicate (if needed for backward compatibility)
-- CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school ON public.teacher_profiles(school_id);
--
-- -- 3. Verify
-- SELECT * FROM pg_indexes WHERE tablename = 'assessment_sessions';
--
-- ============================================================================
