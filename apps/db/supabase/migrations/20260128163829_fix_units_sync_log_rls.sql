-- Migration: Fix RLS policies on units and sync_log tables
-- Addresses:
-- 1. auth_rls_initplan warnings (wrap auth functions in select for performance)
-- 2. multiple_permissive_policies warning for units table (remove overlapping policies)

-- ============================================================================
-- FIX UNITS TABLE POLICIES
-- ============================================================================

-- Drop ALL possible existing policies (old and new names)
DROP POLICY IF EXISTS "units_public_read" ON public.units;
DROP POLICY IF EXISTS "units_service_role_all" ON public.units;
DROP POLICY IF EXISTS "units_select" ON public.units;
DROP POLICY IF EXISTS "units_service_insert" ON public.units;
DROP POLICY IF EXISTS "units_service_update" ON public.units;
DROP POLICY IF EXISTS "units_service_delete" ON public.units;

-- Create single consolidated SELECT policy for units
-- Units are public curriculum data, readable by everyone when active
CREATE POLICY "units_select" ON public.units
    FOR SELECT
    USING (is_active = true);

-- Service role policies for modifications (uses TO service_role for clean policy)
CREATE POLICY "units_service_insert" ON public.units
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "units_service_update" ON public.units
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "units_service_delete" ON public.units
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- FIX SYNC_LOG TABLE POLICIES
-- ============================================================================

-- Drop ALL possible existing policies (old and new names)
DROP POLICY IF EXISTS "sync_log_student_read" ON public.sync_log;
DROP POLICY IF EXISTS "sync_log_service_insert" ON public.sync_log;
DROP POLICY IF EXISTS "sync_log_student_insert" ON public.sync_log;

-- Recreate with (select auth.uid()) wrapper for optimal performance (avoids initplan)
CREATE POLICY "sync_log_student_read" ON public.sync_log
    FOR SELECT
    TO authenticated
    USING (student_id = (select auth.uid()));

CREATE POLICY "sync_log_student_insert" ON public.sync_log
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = (select auth.uid()));
