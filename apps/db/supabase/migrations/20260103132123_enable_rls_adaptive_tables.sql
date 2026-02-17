-- =====================================================
-- Migration 066: Enable RLS on Adaptive Learning Tables
-- =====================================================

-- PART 1: student_knowledge_state
ALTER TABLE IF EXISTS student_knowledge_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_insert ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS service_role_all ON student_knowledge_state;

CREATE POLICY students_own_knowledge_select ON student_knowledge_state
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_knowledge_insert ON student_knowledge_state
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY teachers_view_student_knowledge ON student_knowledge_state
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_knowledge ON student_knowledge_state
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY service_role_all ON student_knowledge_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PART 2: learning_paths (skipped - table does not exist yet)

-- PART 3: student_badges
ALTER TABLE IF EXISTS student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS students_own_badges_insert ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;
DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;
DROP POLICY IF EXISTS service_role_all ON student_badges;

CREATE POLICY students_own_badges_select ON student_badges
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_badges_insert ON student_badges
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY teachers_view_student_badges ON student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_badges ON student_badges
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY service_role_all ON student_badges
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PART 4: ai_tutor_interactions
ALTER TABLE IF EXISTS ai_tutor_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS students_own_interactions_insert ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS service_role_all ON ai_tutor_interactions;

CREATE POLICY students_own_interactions_select ON ai_tutor_interactions
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_interactions_insert ON ai_tutor_interactions
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY teachers_view_student_interactions ON ai_tutor_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ai_tutor_interactions.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_interactions ON ai_tutor_interactions
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY service_role_all ON ai_tutor_interactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PART 5: practice_questions (reference table - public read, admin write)
ALTER TABLE IF EXISTS practice_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_practice_questions ON practice_questions;
DROP POLICY IF EXISTS admin_manage_practice_questions ON practice_questions;
DROP POLICY IF EXISTS service_role_all ON practice_questions;

CREATE POLICY public_read_practice_questions ON practice_questions
  FOR SELECT
  USING (true);

CREATE POLICY admin_manage_practice_questions ON practice_questions
  FOR ALL
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY service_role_all ON practice_questions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PART 6: learning_style_profile
ALTER TABLE IF EXISTS learning_style_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_own_profile_select ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_insert ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_update ON learning_style_profile;
DROP POLICY IF EXISTS teachers_view_student_profile ON learning_style_profile;
DROP POLICY IF EXISTS admin_view_all_profiles ON learning_style_profile;
DROP POLICY IF EXISTS service_role_all ON learning_style_profile;

CREATE POLICY students_own_profile_select ON learning_style_profile
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_profile_insert ON learning_style_profile
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY students_own_profile_update ON learning_style_profile
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY teachers_view_student_profile ON learning_style_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_style_profile.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_profiles ON learning_style_profile
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

CREATE POLICY service_role_all ON learning_style_profile
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PART 7: badges (using 'badges' table instead of 'cultural_badges')
ALTER TABLE IF EXISTS badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_cultural_badges ON badges;
DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;

CREATE POLICY public_read_cultural_badges ON badges
  FOR SELECT
  USING (true);

CREATE POLICY admin_manage_cultural_badges ON badges
  FOR ALL
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );;
