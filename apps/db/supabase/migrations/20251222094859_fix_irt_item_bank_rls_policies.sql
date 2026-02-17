-- =====================================================
-- Migration 039: Fix IRT Item Bank RLS Policies
-- =====================================================
-- Fixes:
-- 1. Replace auth.role() with (SELECT auth.uid()) IS NOT NULL pattern
-- 2. Consolidate duplicate permissive SELECT policies
-- 3. Ensure proper InitPlan pattern for performance
--
-- Issues addressed:
-- - auth.role() is deprecated and causes performance issues
-- - Multiple SELECT policies with overlapping conditions
-- =====================================================

-- Drop existing policies on irt_item_bank
DROP POLICY IF EXISTS "Authenticated users can read active items" ON irt_item_bank;
DROP POLICY IF EXISTS "Service role can manage all items" ON irt_item_bank;
DROP POLICY IF EXISTS "irt_item_bank_admin_all" ON irt_item_bank;
DROP POLICY IF EXISTS "irt_item_bank_read_active" ON irt_item_bank;

-- =====================================================
-- Consolidated RLS Policies
-- =====================================================

-- Policy 1: Authenticated users can read active, approved items
-- Uses InitPlan pattern (SELECT auth.uid()) for performance
-- Replaces both "Authenticated users can read active items" and "irt_item_bank_read_active"
CREATE POLICY "irt_item_bank_authenticated_read"
  ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND review_state = 'approved'
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- Policy 2: Anonymous users can read active, approved items (for guest assessment)
-- No auth check needed - public access for assessment questions
CREATE POLICY "irt_item_bank_anon_read"
  ON irt_item_bank
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND review_state = 'approved'
  );

-- Policy 3: Service role has full access (for admin operations via server actions)
-- Uses JWT role check which is the correct pattern for service_role
CREATE POLICY "irt_item_bank_service_all"
  ON irt_item_bank
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 4: Admin users have full access
-- Uses EXISTS pattern with InitPlan for performance
CREATE POLICY "irt_item_bank_admin_all"
  ON irt_item_bank
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (SELECT auth.uid())
      AND (raw_app_meta_data->>'role' = ANY(ARRAY['admin', 'super_admin']))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (SELECT auth.uid())
      AND (raw_app_meta_data->>'role' = ANY(ARRAY['admin', 'super_admin']))
    )
  );;
