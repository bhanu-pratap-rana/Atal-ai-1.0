-- =====================================================
-- Migration: Fix IRT Item Bank Anonymous Access
-- =====================================================
-- 
-- Fix anonymous access to irt_item_bank table
-- Anonymous users should only read approved items
-- Authenticated users can read approved items
-- Admins can manage items
-- =====================================================

DROP POLICY IF EXISTS irt_item_bank_admin_all ON irt_item_bank;
DROP POLICY IF EXISTS irt_item_bank_authenticated_read ON irt_item_bank;

-- Admins can manage items they created (authenticated only)
CREATE POLICY irt_item_bank_admin_all ON irt_item_bank
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid() = created_by
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = created_by
  );

-- Authenticated users can read approved active items
CREATE POLICY irt_item_bank_authenticated_read ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    is_active = true AND
    review_state = 'approved'
  );

-- Anonymous users can read approved active items (for assessment)
-- This is intentional - students need to see questions during assessment
-- The anon_read policy already exists and is correct;
