-- Migration: Fix Function Search Path and RLS Optimization
-- Date: 2026-01-02
-- Status: CRITICAL FIXES
-- Purpose: Resolve 3 database advisor warnings

-- ============================================================================
-- FIX #1: Set search_path for submit_assessment function
-- ============================================================================
-- Issue: Function has mutable search_path (Security Advisor warning)
-- Impact: Security best practice
-- Priority: LOW (but important for compliance)

ALTER FUNCTION public.submit_assessment(uuid, uuid, jsonb)
SET search_path = public;

-- ============================================================================
-- FIX #2: Set search_path for update_knowledge_state function
-- ============================================================================
-- Issue: Function has mutable search_path (Security Advisor warning)
-- Impact: Security best practice
-- Priority: LOW (but important for compliance)

ALTER FUNCTION public.update_knowledge_state(uuid, uuid, uuid, boolean, integer, boolean)
SET search_path = public;

-- ============================================================================
-- FIX #3: Optimize RLS InitPlan performance on irt_item_bank
-- ============================================================================
-- Issue: Policy irt_item_bank_admin_all re-evaluates auth.uid() for each row
-- Impact: Better query performance at scale (caches auth.uid() value)
-- Priority: MEDIUM
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop existing policy
DROP POLICY IF EXISTS irt_item_bank_admin_all ON public.irt_item_bank;

-- Recreate with optimized search condition
-- Uses (SELECT auth.uid()) to cache the value instead of calling it per row
CREATE POLICY irt_item_bank_admin_all
ON public.irt_item_bank
FOR ALL
USING ((SELECT auth.uid()) = created_by)
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Comment documenting the optimization
COMMENT ON POLICY irt_item_bank_admin_all ON public.irt_item_bank IS
'Optimized RLS policy: Uses (SELECT auth.uid()) to cache the function result, ' ||
'improving performance on large result sets. Cache is held for the duration of ' ||
'the query, preventing re-evaluation for each row.';
