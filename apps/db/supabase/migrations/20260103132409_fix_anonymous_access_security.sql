-- =====================================================
-- Migration: Fix Anonymous Access Security Issues
-- =====================================================
-- 
-- This migration fixes security warnings by ensuring that:
-- 1. Student-specific data requires authentication (auth.uid() IS NOT NULL)
-- 2. Policies that check auth.uid() also verify the user is authenticated
-- 3. Sensitive tables are restricted to authenticated users only
--
-- Public access is intentionally allowed for:
-- - badges (reference data)
-- - curriculum_content (reference data)  
-- - practice_questions (reference data)
-- - usernames (for username lookup during signup)
-- =====================================================

-- =====================================================
-- PART 1: student_knowledge_state
-- =====================================================

DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_insert ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;

-- Students can view their own knowledge state (authenticated only)
CREATE POLICY students_own_knowledge_select ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own knowledge state (authenticated only)
CREATE POLICY students_own_knowledge_insert ON student_knowledge_state
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can update their own knowledge state (authenticated only)
CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view knowledge state of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_knowledge ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can view all knowledge states (authenticated only)
CREATE POLICY admin_view_all_knowledge ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 2: student_badges
-- =====================================================

DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS students_own_badges_insert ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;
DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;

-- Students can view their own badges (authenticated only)
CREATE POLICY students_own_badges_select ON student_badges
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own badges (authenticated only)
CREATE POLICY students_own_badges_insert ON student_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view badges of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_badges ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can view all student badges (authenticated only)
CREATE POLICY admin_view_all_badges ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 3: ai_tutor_interactions
-- =====================================================

DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS students_own_interactions_insert ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;

-- Students can view their own tutor interactions (authenticated only)
CREATE POLICY students_own_interactions_select ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own tutor interactions (authenticated only)
CREATE POLICY students_own_interactions_insert ON ai_tutor_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view tutor interactions of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_interactions ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ai_tutor_interactions.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can view all tutor interactions (authenticated only)
CREATE POLICY admin_view_all_interactions ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 4: learning_style_profile
-- =====================================================

DROP POLICY IF EXISTS students_own_profile_select ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_insert ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_update ON learning_style_profile;
DROP POLICY IF EXISTS teachers_view_student_profile ON learning_style_profile;
DROP POLICY IF EXISTS admin_view_all_profiles ON learning_style_profile;
DROP POLICY IF EXISTS students_own_learning_style_select ON learning_style_profile;
DROP POLICY IF EXISTS students_own_learning_style_insert ON learning_style_profile;
DROP POLICY IF EXISTS students_own_learning_style_update ON learning_style_profile;

-- Students can view their own learning style profile (authenticated only)
CREATE POLICY students_own_profile_select ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own learning style profile (authenticated only)
CREATE POLICY students_own_profile_insert ON learning_style_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can update their own learning style profile (authenticated only)
CREATE POLICY students_own_profile_update ON learning_style_profile
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view learning style of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_profile ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_style_profile.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can view all learning style profiles (authenticated only)
CREATE POLICY admin_view_all_profiles ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 5: points_history
-- =====================================================

DROP POLICY IF EXISTS students_own_points_select ON points_history;
DROP POLICY IF EXISTS teachers_view_student_points ON points_history;

-- Students can view their own points (authenticated only)
CREATE POLICY students_own_points_select ON points_history
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view points of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_points ON points_history
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- PART 6: formative_responses
-- =====================================================

DROP POLICY IF EXISTS students_own_formative_select ON formative_responses;
DROP POLICY IF EXISTS students_own_formative_insert ON formative_responses;
DROP POLICY IF EXISTS teachers_view_student_formative ON formative_responses;

-- Students can view their own formative responses (authenticated only)
CREATE POLICY students_own_formative_select ON formative_responses
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own formative responses (authenticated only)
CREATE POLICY students_own_formative_insert ON formative_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view formative responses of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_formative ON formative_responses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- PART 7: summative_results
-- =====================================================

DROP POLICY IF EXISTS students_own_summative_select ON summative_results;
DROP POLICY IF EXISTS teachers_view_student_summative ON summative_results;

-- Students can view their own summative results (authenticated only)
CREATE POLICY students_own_summative_select ON summative_results
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view summative results of students in their classes (authenticated only)
CREATE POLICY teachers_view_student_summative ON summative_results
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- PART 8: student_profiles
-- =====================================================

DROP POLICY IF EXISTS student_profile_self_select ON student_profiles;
DROP POLICY IF EXISTS student_profile_self_update ON student_profiles;
DROP POLICY IF EXISTS student_profile_self_insert ON student_profiles;
DROP POLICY IF EXISTS student_profile_teacher_select ON student_profiles;

-- Students can view their own profile (authenticated only)
CREATE POLICY student_profile_self_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can insert their own profile (authenticated only)
CREATE POLICY student_profile_self_insert ON student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Students can update their own profile (authenticated only)
CREATE POLICY student_profile_self_update ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can view profiles of students in their classes (authenticated only)
CREATE POLICY student_profile_teacher_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    is_teacher() AND
    user_id IN (SELECT get_teacher_student_ids())
  );

-- =====================================================
-- PART 9: classes (fix anonymous access)
-- =====================================================

DROP POLICY IF EXISTS classes_select ON classes;

-- Users can view classes they teach or are enrolled in (authenticated only)
CREATE POLICY classes_select ON classes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      teacher_id = auth.uid() OR
      id IN (SELECT get_user_enrolled_class_ids(auth.uid()))
    )
  );

-- =====================================================
-- PART 10: enrollments (fix anonymous access)
-- =====================================================

DROP POLICY IF EXISTS enrollments_select ON enrollments;

-- Users can view enrollments for their classes or as students (authenticated only)
CREATE POLICY enrollments_select ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      student_id = auth.uid() OR
      class_id IN (SELECT get_teacher_class_ids(auth.uid()))
    )
  );

-- =====================================================
-- PART 11: school_staff_credentials (already service_role only, but ensure it)
-- =====================================================

-- These policies are already correctly restricted to service_role
-- No changes needed, but ensuring they're properly secured

-- =====================================================
-- PART 12: badges (intentionally public - no change needed)
-- =====================================================
-- badges table is intentionally public for reference data
-- No changes needed

-- =====================================================
-- PART 13: curriculum_content (intentionally public - no change needed)
-- =====================================================
-- curriculum_content table is intentionally public for reference data
-- No changes needed

-- =====================================================
-- PART 14: practice_questions (intentionally public - no change needed)
-- =====================================================
-- practice_questions table is intentionally public for reference data
-- No changes needed

-- =====================================================
-- PART 15: usernames (intentionally allows anonymous for signup lookup)
-- =====================================================
-- usernames table intentionally allows anonymous access for username lookup during signup
-- No changes needed;
