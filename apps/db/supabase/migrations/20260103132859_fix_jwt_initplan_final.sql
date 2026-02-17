-- =====================================================
-- Migration: Fix JWT InitPlan - Final Fix
-- =====================================================
-- 
-- The correct pattern is: (SELECT auth.jwt())->'app_metadata'->>'role'
-- This wraps the function call but allows the JSON path to work
-- =====================================================

-- =====================================================
-- PART 1: student_knowledge_state
-- =====================================================

DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;

CREATE POLICY admin_view_all_knowledge ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 2: student_badges
-- =====================================================

DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;

CREATE POLICY admin_view_all_badges ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 3: ai_tutor_interactions
-- =====================================================

DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;

CREATE POLICY admin_view_all_interactions ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 4: learning_style_profile
-- =====================================================

DROP POLICY IF EXISTS admin_view_all_profiles ON learning_style_profile;

CREATE POLICY admin_view_all_profiles ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 5: practice_questions
-- =====================================================

DROP POLICY IF EXISTS admin_manage_practice_questions ON practice_questions;

CREATE POLICY admin_manage_practice_questions ON practice_questions
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 6: badges
-- =====================================================

DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;

CREATE POLICY admin_manage_cultural_badges ON badges
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    ((SELECT auth.jwt())->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );;
