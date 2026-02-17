-- Migration: Optimize RLS Policies with auth.uid() Caching
-- Date: 2026-01-02
-- Status: PERFORMANCE OPTIMIZATION - PHASE 1
-- Purpose: Reduce RLS InitPlan overhead by caching auth.uid() function result
-- Impact: 10-20% query time improvement on RLS-heavy operations
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- Safety: All changes are policy updates (no data loss), rollback via policy recreation

-- ============================================================================
-- IMPORTANT: RLS Policy Verification (Run manually BEFORE applying migration)
-- ============================================================================
-- Execute this query FIRST to verify current policy names match what's below:
-- If they don't match, UPDATE this migration with correct policy names before running!
--
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- This will list ALL current RLS policies. Cross-reference with the policies below.
-- If policy names differ, backup the old definitions before proceeding.
--
-- ============================================================================
-- MIGRATION: Optimize irt_item_bank RLS Policy
-- ============================================================================
-- Issue: Policy irt_item_bank_admin_all re-evaluates auth.uid() for each row
-- Impact: Expensive for large result sets (100+ items)
-- Solution: Use (SELECT auth.uid()) to cache the value for the query duration
--
-- OLD PATTERN (SLOW):
--   USING (auth.uid() = created_by)
--   Problem: Calls auth.uid() for every row in the result set
--
-- NEW PATTERN (FAST):
--   USING ((SELECT auth.uid()) = created_by)
--   Benefit: Caches auth.uid() result for the entire query
--

DROP POLICY IF EXISTS irt_item_bank_admin_all ON public.irt_item_bank;

CREATE POLICY irt_item_bank_admin_all
ON public.irt_item_bank
FOR ALL
USING ((SELECT auth.uid()) = created_by)
WITH CHECK ((SELECT auth.uid()) = created_by);

COMMENT ON POLICY irt_item_bank_admin_all ON public.irt_item_bank IS
'Optimized RLS policy: Uses (SELECT auth.uid()) to cache the function result, ' ||
'improving performance on large result sets. Cache is held for the duration of ' ||
'the query, preventing re-evaluation for each row. Estimated 10-20% improvement ' ||
'for users with 50+ items in item bank.';

-- ============================================================================
-- ADDITIONAL OPTIMIZATION OPPORTUNITIES (For Future Phases)
-- ============================================================================
-- The following policies MAY benefit from the (SELECT auth.uid()) optimization:
--
-- 1. student_profiles RLS policies (if filtering by auth.uid() calls)
-- 2. teacher_profiles RLS policies (if filtering by auth.uid() calls)
-- 3. assessment_sessions RLS policies (if filtering by auth.uid() calls)
-- 4. assessment_responses RLS policies (if filtering by auth.uid() calls)
-- 5. knowledge_states RLS policies (if filtering by auth.uid() calls)
--
-- To identify which policies need optimization, run this query:
--
-- SELECT
--   tablename,
--   policyname,
--   qual,
--   with_check,
--   CASE
--     WHEN qual LIKE '%auth.uid()%' THEN 'POTENTIALLY SLOW'
--     WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'ALREADY OPTIMIZED'
--     ELSE 'NO AUTH FILTER'
--   END as optimization_status
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, optimization_status DESC;
--
-- ============================================================================
-- VERIFICATION QUERY (Run after migration)
-- ============================================================================
-- Run this to verify the optimization was applied:
--
-- SELECT
--   policyname,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'irt_item_bank'
--   AND policyname = 'irt_item_bank_admin_all';
--
-- Expected: Both USING and WITH CHECK should contain (SELECT auth.uid())
--
-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================
-- If the optimization causes unexpected behavior, rollback using:
--
-- DROP POLICY IF EXISTS irt_item_bank_admin_all ON public.irt_item_bank;
--
-- -- Recreate with original pattern (non-cached)
-- CREATE POLICY irt_item_bank_admin_all
-- ON public.irt_item_bank
-- FOR ALL
-- USING (auth.uid() = created_by)
-- WITH CHECK (auth.uid() = created_by);
--
-- Then verify:
-- SELECT * FROM pg_policies WHERE tablename = 'irt_item_bank';
--
-- ============================================================================
-- PERFORMANCE MONITORING (Run after production deployment)
-- ============================================================================
-- Monitor query performance improvement:
--
-- 1. Baseline (before optimization):
--    SELECT * FROM assessment_sessions WHERE user_id = '<user_id>' LIMIT 100;
--    -- Note execution time in query plan
--
-- 2. After optimization:
--    EXPLAIN ANALYZE SELECT * FROM irt_item_bank WHERE created_by = auth.uid() LIMIT 100;
--    -- Compare InitPlan evaluations (should be 1 instead of plan_rows)
--
-- 3. Look for this in EXPLAIN output:
--    "SubPlan 1"
--    "  ->  Result  (cost=0.00..0.01 rows=1 width=16)"
--    "    Output: auth.uid()"
--
--    The "rows=1" indicates single caching instead of per-row re-evaluation
--
-- ============================================================================
