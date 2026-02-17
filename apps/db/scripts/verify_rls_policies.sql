-- Script to verify RLS policies on units and sync_log tables
-- Run this in the Supabase SQL Editor to check current state

-- ============================================================================
-- CHECK CURRENT POLICIES
-- ============================================================================

-- Check units table policies
SELECT
    policyname,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'units'
ORDER BY policyname;

-- Check sync_log table policies
SELECT
    policyname,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'sync_log'
ORDER BY policyname;

-- ============================================================================
-- EXPECTED RESULTS AFTER MIGRATION 149:
-- ============================================================================
-- units table should have:
--   - units_select (SELECT, is_active = true)
--   - units_service_insert (INSERT, auth.role() = 'service_role')
--   - units_service_update (UPDATE, auth.role() = 'service_role')
--   - units_service_delete (DELETE, auth.role() = 'service_role')
--
-- sync_log table should have:
--   - sync_log_student_read (SELECT, student_id = auth.uid())
--   - sync_log_student_insert (INSERT, student_id = auth.uid())
--
-- If you still see:
--   - units_public_read
--   - units_service_role_all
--   - sync_log_service_insert
-- Then migration 149 was not applied correctly.
