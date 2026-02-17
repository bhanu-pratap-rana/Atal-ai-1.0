-- Migration 149: Fix RLS policies for units and sync_log tables
-- Addresses:
-- 1. auth_rls_initplan warnings (wrap auth functions in select)
-- 2. multiple_permissive_policies warning for units table

-- ============================================================================
-- FIX UNITS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "units_public_read" ON public.units;
DROP POLICY IF EXISTS "units_service_role_all" ON public.units;

-- Create single consolidated SELECT policy for units
-- Units are public curriculum data, readable by everyone
CREATE POLICY "units_select" ON public.units
    FOR SELECT
    USING (is_active = true);

-- Service role policies for modifications (using select wrapper for performance)
CREATE POLICY "units_service_insert" ON public.units
    FOR INSERT
    WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "units_service_update" ON public.units
    FOR UPDATE
    USING ((select auth.role()) = 'service_role');

CREATE POLICY "units_service_delete" ON public.units
    FOR DELETE
    USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- FIX SYNC_LOG TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "sync_log_student_read" ON public.sync_log;
DROP POLICY IF EXISTS "sync_log_service_insert" ON public.sync_log;

-- Recreate with select wrapper for performance
CREATE POLICY "sync_log_student_read" ON public.sync_log
    FOR SELECT
    TO authenticated
    USING (student_id = (select auth.uid()));

CREATE POLICY "sync_log_student_insert" ON public.sync_log
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = (select auth.uid()));
