-- =====================================================
-- Migration 069: Fix Remaining Performance Issues
-- =====================================================
--
-- This migration addresses:
-- 1. Fix remaining multiple_permissive_policies by separating ALL policies from SELECT
--
-- =====================================================

-- badges: Change badges_admin_manage to only apply to INSERT/UPDATE/DELETE (not SELECT)
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

-- irt_item_bank: Change irt_item_bank_admin_all to only apply to INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS irt_item_bank_admin_all ON irt_item_bank;
CREATE POLICY irt_item_bank_admin_insert ON irt_item_bank
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = created_by
  );
CREATE POLICY irt_item_bank_admin_update ON irt_item_bank
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = created_by
  )
  WITH CHECK (
    (SELECT auth.uid()) = created_by
  );
CREATE POLICY irt_item_bank_admin_delete ON irt_item_bank
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = created_by
  );

-- practice_questions: Change practice_questions_admin_manage to only apply to INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS practice_questions_admin_manage ON practice_questions;
CREATE POLICY practice_questions_admin_insert ON practice_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );
CREATE POLICY practice_questions_admin_update ON practice_questions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );
CREATE POLICY practice_questions_admin_delete ON practice_questions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- usernames: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS usernames_authenticated_exists_check ON usernames;
DROP POLICY IF EXISTS usernames_self_read ON usernames;

CREATE POLICY usernames_authenticated_select ON usernames
  FOR SELECT
  TO authenticated
  USING (
    -- Users can check if any username exists (for signup validation)
    true
    OR
    -- Users can view their own username
    user_id = (SELECT auth.uid())
  );
;
