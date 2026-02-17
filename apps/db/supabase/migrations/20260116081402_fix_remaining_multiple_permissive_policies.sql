-- Migration 130: Fix Remaining Multiple Permissive Policies
-- Issue: Admin policies with ALL command conflict with SELECT policies
-- Fix: Change admin policies to only cover INSERT, UPDATE, DELETE (not SELECT)

-- Fix badges: Change admin_manage from ALL to separate INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS badges_admin_manage ON badges;

CREATE POLICY badges_admin_insert ON badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY badges_admin_update ON badges
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY badges_admin_delete ON badges
  FOR DELETE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Fix feature_flags: Change admin_manage from ALL to separate INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS feature_flags_admin_manage ON feature_flags;

CREATE POLICY feature_flags_admin_insert ON feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY feature_flags_admin_update ON feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY feature_flags_admin_delete ON feature_flags
  FOR DELETE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );;
