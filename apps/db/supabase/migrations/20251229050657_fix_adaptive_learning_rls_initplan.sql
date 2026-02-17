-- Migration 050: Fix RLS InitPlan Performance Issues
--
-- Fixes 23 RLS policies that re-evaluate auth.uid() for each row.
-- Uses the (SELECT auth.uid()) pattern for optimal query performance.

-- ============================================================
-- PART 1: Fix irt_item_bank admin policy
-- ============================================================

DROP POLICY IF EXISTS irt_item_bank_admin_all ON irt_item_bank;

-- Admin can do all operations (using JWT metadata for role check)
CREATE POLICY irt_item_bank_admin_all ON irt_item_bank
  FOR ALL
  USING (
    (SELECT auth.jwt()->>'role') = 'service_role' OR
    (SELECT (auth.jwt()->'app_metadata'->>'role')) = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role' OR
    (SELECT (auth.jwt()->'app_metadata'->>'role')) = 'admin'
  );

-- ============================================================
-- PART 2: Fix student_knowledge_state policies
-- ============================================================

DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_insert ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;

-- Students can view their own knowledge state
CREATE POLICY students_own_knowledge_select ON student_knowledge_state
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own knowledge state
CREATE POLICY students_own_knowledge_insert ON student_knowledge_state
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own knowledge state
CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view student knowledge in their classes
CREATE POLICY teachers_view_student_knowledge ON student_knowledge_state
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 3: Fix learning_style_profile policies
-- ============================================================

DROP POLICY IF EXISTS students_own_learning_style_select ON learning_style_profile;
DROP POLICY IF EXISTS students_own_learning_style_insert ON learning_style_profile;
DROP POLICY IF EXISTS students_own_learning_style_update ON learning_style_profile;

-- Students can view their own learning style
CREATE POLICY students_own_learning_style_select ON learning_style_profile
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own learning style
CREATE POLICY students_own_learning_style_insert ON learning_style_profile
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own learning style
CREATE POLICY students_own_learning_style_update ON learning_style_profile
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- ============================================================
-- PART 4: Fix ai_tutor_interactions policies
-- ============================================================

DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS students_own_interactions_insert ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;

-- Students can view their own interactions
CREATE POLICY students_own_interactions_select ON ai_tutor_interactions
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own interactions
CREATE POLICY students_own_interactions_insert ON ai_tutor_interactions
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view student interactions in their classes
CREATE POLICY teachers_view_student_interactions ON ai_tutor_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 5: Fix formative_responses policies
-- ============================================================

DROP POLICY IF EXISTS students_own_formative_select ON formative_responses;
DROP POLICY IF EXISTS students_own_formative_insert ON formative_responses;
DROP POLICY IF EXISTS teachers_view_student_formative ON formative_responses;

-- Students can view their own formative responses
CREATE POLICY students_own_formative_select ON formative_responses
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own formative responses
CREATE POLICY students_own_formative_insert ON formative_responses
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view student formative responses in their classes
CREATE POLICY teachers_view_student_formative ON formative_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 6: Fix summative_results policies
-- ============================================================

DROP POLICY IF EXISTS students_own_summative_select ON summative_results;
DROP POLICY IF EXISTS teachers_view_student_summative ON summative_results;

-- Students can view their own summative results
CREATE POLICY students_own_summative_select ON summative_results
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Teachers can view student summative results in their classes
CREATE POLICY teachers_view_student_summative ON summative_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 7: Fix student_badges policies
-- ============================================================

DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;

-- Students can view their own badges
CREATE POLICY students_own_badges_select ON student_badges
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Teachers can view student badges in their classes
CREATE POLICY teachers_view_student_badges ON student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 8: Fix points_history policies
-- ============================================================

DROP POLICY IF EXISTS students_own_points_select ON points_history;
DROP POLICY IF EXISTS teachers_view_student_points ON points_history;

-- Students can view their own points history
CREATE POLICY students_own_points_select ON points_history
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Teachers can view student points in their classes
CREATE POLICY teachers_view_student_points ON points_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 9: Add missing foreign key indexes
-- ============================================================

-- Index for irt_item_bank.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_created_by
  ON irt_item_bank(created_by);

-- Index for irt_item_bank.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_updated_by
  ON irt_item_bank(updated_by);

-- Index for student_badges.badge_id foreign key
CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id
  ON student_badges(badge_id);;
