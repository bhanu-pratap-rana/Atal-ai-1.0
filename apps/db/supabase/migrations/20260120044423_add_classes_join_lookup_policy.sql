-- Migration: 130_add_classes_join_lookup_policy
-- Date: 2026-01-16
-- Purpose: Allow authenticated users to preview classes by code for join flow
-- Security: Class codes are shareable invite links; PIN validation provides access control
-- Note: This is intentionally permissive for SELECT only

-- ============================================================================
-- PART 1: Add RLS policy for class join lookup
-- ============================================================================
-- Problem: Students can't preview classes they're not enrolled in yet
-- Solution: Add permissive SELECT policy that allows authenticated users to read classes
-- Security: PIN validation in application layer provides actual access control

CREATE POLICY "classes_join_lookup" ON public.classes
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "classes_join_lookup" ON public.classes IS 
  'Allows class preview by code for join flow. PIN validation in app layer provides security.';;
