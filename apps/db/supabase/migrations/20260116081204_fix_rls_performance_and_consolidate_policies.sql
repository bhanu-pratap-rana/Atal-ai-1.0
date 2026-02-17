-- Migration 129: Fix RLS Performance and Consolidate Multiple Permissive Policies
-- Purpose: Consolidate multiple permissive policies for better performance

-- PART 1: Consolidate badges policies
DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;
DROP POLICY IF EXISTS public_read_cultural_badges ON badges;

CREATE POLICY badges_consolidated_select ON badges
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY badges_admin_manage ON badges
  FOR ALL
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- PART 2: Consolidate feature_flags policies
DROP POLICY IF EXISTS feature_flags_admin_manage ON feature_flags;
DROP POLICY IF EXISTS feature_flags_read_all ON feature_flags;

CREATE POLICY feature_flags_consolidated_select ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY feature_flags_admin_manage ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );;
