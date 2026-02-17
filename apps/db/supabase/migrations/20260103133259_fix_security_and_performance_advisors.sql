-- =====================================================
-- Migration 068: Fix Security and Performance Advisor Warnings
-- =====================================================
--
-- This migration addresses:
-- 1. Security: Remove anonymous access from RLS policies (22 warnings)
-- 2. Performance: Consolidate multiple permissive policies (12 warnings)
--
-- =====================================================

-- =====================================================
-- PART 1: Fix anonymous access policies (Security)
-- =====================================================

-- badges: Change public_read_cultural_badges to authenticated only
DROP POLICY IF EXISTS public_read_cultural_badges ON badges;
CREATE POLICY public_read_cultural_badges ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- curriculum_content: Change curriculum_public_read to authenticated only
DROP POLICY IF EXISTS curriculum_public_read ON curriculum_content;
CREATE POLICY curriculum_public_read ON curriculum_content
  FOR SELECT
  TO authenticated
  USING (true);

-- irt_item_bank: Remove anon_read (will be consolidated below)
DROP POLICY IF EXISTS irt_item_bank_anon_read ON irt_item_bank;

-- usernames: Change to authenticated only (username checks should require auth)
DROP POLICY IF EXISTS usernames_public_exists_check ON usernames;
CREATE POLICY usernames_authenticated_exists_check ON usernames
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PART 2: Consolidate multiple permissive policies (Performance)
-- =====================================================

-- ai_tutor_interactions: Consolidate 3 SELECT policies into 1
DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;

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

-- badges: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;

-- Note: public_read_cultural_badges already recreated above with TO authenticated
-- Now create admin manage policy for non-SELECT operations
CREATE POLICY badges_admin_manage ON badges
  FOR ALL
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- classes: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS classes_join_lookup ON classes;
DROP POLICY IF EXISTS classes_select ON classes;

CREATE POLICY classes_authenticated_select ON classes
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers can view their own classes
    teacher_id = (SELECT auth.uid())
    OR
    -- Students can view classes they're enrolled in
    id IN (SELECT get_user_enrolled_class_ids((SELECT auth.uid())))
  );

-- formative_responses: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS students_own_formative_select ON formative_responses;
DROP POLICY IF EXISTS teachers_view_student_formative ON formative_responses;

CREATE POLICY formative_responses_authenticated_select ON formative_responses
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own responses
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view responses of students in their classes
    (
      EXISTS (
        SELECT 1 FROM teacher_profiles tp
        WHERE tp.user_id = (SELECT auth.uid())
      )
      AND student_id IN (
        SELECT e.student_id FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE c.teacher_id = (SELECT auth.uid())
      )
    )
  );

-- irt_item_bank: Consolidate SELECT policies into 1
DROP POLICY IF EXISTS irt_item_bank_authenticated_read ON irt_item_bank;

-- Create consolidated SELECT policy
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

-- learning_style_profile: Consolidate 3 SELECT policies into 1
DROP POLICY IF EXISTS students_own_profile_select ON learning_style_profile;
DROP POLICY IF EXISTS teachers_view_student_profile ON learning_style_profile;
DROP POLICY IF EXISTS admin_view_all_profiles ON learning_style_profile;

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

-- points_history: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS students_own_points_select ON points_history;
DROP POLICY IF EXISTS teachers_view_student_points ON points_history;

CREATE POLICY points_history_authenticated_select ON points_history
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own points
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view points of students in their classes
    (
      EXISTS (
        SELECT 1 FROM teacher_profiles tp
        WHERE tp.user_id = (SELECT auth.uid())
      )
      AND student_id IN (
        SELECT e.student_id FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE c.teacher_id = (SELECT auth.uid())
      )
    )
  );

-- practice_questions: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS public_read_practice_questions ON practice_questions;
DROP POLICY IF EXISTS admin_manage_practice_questions ON practice_questions;

CREATE POLICY practice_questions_authenticated_select ON practice_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage practice questions (separate ALL policy for INSERT/UPDATE/DELETE)
CREATE POLICY practice_questions_admin_manage ON practice_questions
  FOR ALL
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- student_badges: Consolidate 3 SELECT policies into 1
DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;
DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;

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

-- student_knowledge_state: Consolidate 3 SELECT policies into 1
DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;

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

-- student_profiles: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS student_profile_self_select ON student_profiles;
DROP POLICY IF EXISTS student_profile_teacher_select ON student_profiles;

CREATE POLICY student_profiles_authenticated_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own profile
    user_id = (SELECT auth.uid())
    OR
    -- Teachers can view profiles of students in their classes
    (
      is_teacher()
      AND user_id IN (SELECT get_teacher_student_ids())
    )
  );

-- summative_results: Consolidate 2 SELECT policies into 1
DROP POLICY IF EXISTS students_own_summative_select ON summative_results;
DROP POLICY IF EXISTS teachers_view_student_summative ON summative_results;

CREATE POLICY summative_results_authenticated_select ON summative_results
  FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own results
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view results of students in their classes
    (
      EXISTS (
        SELECT 1 FROM teacher_profiles tp
        WHERE tp.user_id = (SELECT auth.uid())
      )
      AND student_id IN (
        SELECT e.student_id FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE c.teacher_id = (SELECT auth.uid())
      )
    )
  );

-- =====================================================
-- PART 3: Ensure all remaining policies explicitly use TO authenticated
-- =====================================================

-- schools: Ensure TO authenticated
DROP POLICY IF EXISTS schools_read ON schools;
CREATE POLICY schools_read ON schools
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);
;
