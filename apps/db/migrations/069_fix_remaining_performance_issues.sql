-- =====================================================
-- Migration 069: Fix Remaining Performance Issues
-- =====================================================
--
-- This migration addresses:
-- 1. Fix auth_rls_initplan warnings by wrapping auth functions in subqueries
-- 2. Fix remaining multiple_permissive_policies by separating ALL policies from SELECT
--
-- =====================================================

-- =====================================================
-- PART 1: Fix auth_rls_initplan warnings
-- =====================================================

-- ai_tutor_interactions: Wrap auth functions in subqueries
DROP POLICY IF EXISTS ai_tutor_interactions_authenticated_select ON ai_tutor_interactions;
CREATE POLICY ai_tutor_interactions_authenticated_select ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own interactions
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view interactions of students in their classes
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ai_tutor_interactions.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
    OR
    -- Admins can view all interactions
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- badges: Fix badges_admin_manage to wrap auth functions
DROP POLICY IF EXISTS badges_admin_manage ON badges;
CREATE POLICY badges_admin_manage ON badges
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- irt_item_bank: Fix irt_item_bank_authenticated_select to wrap auth functions
DROP POLICY IF EXISTS irt_item_bank_authenticated_select ON irt_item_bank;
CREATE POLICY irt_item_bank_authenticated_select ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING (
    -- Authenticated users can read active approved items
    (is_active = true AND review_state = 'approved')
    OR
    -- Users can read items they created
    (SELECT auth.uid()) = created_by
    OR
    -- Admins can read all items
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- learning_style_profile: Fix to wrap auth functions
DROP POLICY IF EXISTS learning_style_profile_authenticated_select ON learning_style_profile;
CREATE POLICY learning_style_profile_authenticated_select ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own profile
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view profiles of students in their classes
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_style_profile.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
    OR
    -- Admins can view all profiles
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- practice_questions: Fix practice_questions_admin_manage to wrap auth functions
DROP POLICY IF EXISTS practice_questions_admin_manage ON practice_questions;
CREATE POLICY practice_questions_admin_manage ON practice_questions
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- student_badges: Fix to wrap auth functions
DROP POLICY IF EXISTS student_badges_authenticated_select ON student_badges;
CREATE POLICY student_badges_authenticated_select ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own badges
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view badges of students in their classes
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
    OR
    -- Admins can view all badges
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- student_knowledge_state: Fix to wrap auth functions
DROP POLICY IF EXISTS student_knowledge_state_authenticated_select ON student_knowledge_state;
CREATE POLICY student_knowledge_state_authenticated_select ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own knowledge state
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view knowledge state of students in their classes
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
    OR
    -- Admins can view all knowledge states
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 2: Fix remaining multiple_permissive_policies
-- =====================================================

-- badges: The badges_admin_manage is now INSERT/UPDATE/DELETE only, so no conflict
-- (Already fixed above)

-- irt_item_bank: Change irt_item_bank_admin_all to only apply to INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS irt_item_bank_admin_all ON irt_item_bank;
CREATE POLICY irt_item_bank_admin_all ON irt_item_bank
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = created_by
  )
  WITH CHECK (
    (SELECT auth.uid()) = created_by
  );

-- practice_questions: Already fixed above (practice_questions_admin_manage is now INSERT/UPDATE/DELETE only)

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

