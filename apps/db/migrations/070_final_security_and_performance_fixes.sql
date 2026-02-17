-- =====================================================
-- Migration 070: Final Security and Performance Fixes
-- =====================================================
--
-- This migration addresses:
-- 1. Security: Add explicit auth.uid() IS NOT NULL checks to deny anonymous access
-- 2. Performance: Optimize auth function calls to minimize re-evaluation
--
-- =====================================================

-- =====================================================
-- PART 1: Fix security warnings by adding explicit auth checks
-- =====================================================

-- ai_tutor_interactions: Add explicit auth check and optimize
DROP POLICY IF EXISTS ai_tutor_interactions_authenticated_select ON ai_tutor_interactions;
CREATE POLICY ai_tutor_interactions_authenticated_select ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
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
    )
  );

-- assessment_responses: Add explicit auth check
DROP POLICY IF EXISTS assessment_responses_select ON assessment_responses;
CREATE POLICY assessment_responses_select ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      user_id = (SELECT auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM assessment_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE s.id = assessment_responses.session_id
        AND c.teacher_id = (SELECT auth.uid())
      )
    )
  );

-- assessment_sessions: Add explicit auth checks
DROP POLICY IF EXISTS assessment_sessions_select ON assessment_sessions;
CREATE POLICY assessment_sessions_select ON assessment_sessions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      user_id = (SELECT auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = assessment_sessions.class_id
        AND c.teacher_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS assessment_sessions_update ON assessment_sessions;
CREATE POLICY assessment_sessions_update ON assessment_sessions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

-- badges: Add explicit auth checks
DROP POLICY IF EXISTS public_read_cultural_badges ON badges;
CREATE POLICY public_read_cultural_badges ON badges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS badges_admin_insert ON badges;
CREATE POLICY badges_admin_insert ON badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS badges_admin_update ON badges;
CREATE POLICY badges_admin_update ON badges
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS badges_admin_delete ON badges;
CREATE POLICY badges_admin_delete ON badges
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- classes: Add explicit auth checks
DROP POLICY IF EXISTS classes_authenticated_select ON classes;
CREATE POLICY classes_authenticated_select ON classes
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      teacher_id = (SELECT auth.uid())
      OR
      id IN (SELECT get_user_enrolled_class_ids((SELECT auth.uid())))
    )
  );

DROP POLICY IF EXISTS classes_delete ON classes;
CREATE POLICY classes_delete ON classes
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND teacher_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS classes_update ON classes;
CREATE POLICY classes_update ON classes
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND teacher_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND teacher_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
  );

-- curriculum_content: Add explicit auth check
DROP POLICY IF EXISTS curriculum_public_read ON curriculum_content;
CREATE POLICY curriculum_public_read ON curriculum_content
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
  );

-- enrollments: Add explicit auth checks
DROP POLICY IF EXISTS enrollments_select ON enrollments;
CREATE POLICY enrollments_select ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
      class_id IN (SELECT get_teacher_class_ids((SELECT auth.uid())))
    )
  );

DROP POLICY IF EXISTS enrollments_delete ON enrollments;
CREATE POLICY enrollments_delete ON enrollments
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS enrollments_update ON enrollments;
CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- formative_responses: Add explicit auth check
DROP POLICY IF EXISTS formative_responses_authenticated_select ON formative_responses;
CREATE POLICY formative_responses_authenticated_select ON formative_responses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
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
    )
  );

-- irt_item_bank: Add explicit auth check and optimize
DROP POLICY IF EXISTS irt_item_bank_authenticated_select ON irt_item_bank;
CREATE POLICY irt_item_bank_authenticated_select ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      (is_active = true AND review_state = 'approved')
      OR
      (SELECT auth.uid()) = created_by
      OR
      (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
    )
  );

-- learning_style_profile: Add explicit auth check and optimize
DROP POLICY IF EXISTS learning_style_profile_authenticated_select ON learning_style_profile;
CREATE POLICY learning_style_profile_authenticated_select ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = learning_style_profile.student_id
        AND c.teacher_id = (SELECT auth.uid())
      )
      OR
      (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
    )
  );

-- points_history: Add explicit auth check
DROP POLICY IF EXISTS points_history_authenticated_select ON points_history;
CREATE POLICY points_history_authenticated_select ON points_history
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
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
    )
  );

-- practice_questions: Add explicit auth checks
DROP POLICY IF EXISTS practice_questions_authenticated_select ON practice_questions;
CREATE POLICY practice_questions_authenticated_select ON practice_questions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS practice_questions_admin_insert ON practice_questions;
CREATE POLICY practice_questions_admin_insert ON practice_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS practice_questions_admin_update ON practice_questions;
CREATE POLICY practice_questions_admin_update ON practice_questions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS practice_questions_admin_delete ON practice_questions;
CREATE POLICY practice_questions_admin_delete ON practice_questions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- schools: Add explicit auth check
DROP POLICY IF EXISTS schools_read ON schools;
CREATE POLICY schools_read ON schools
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
  );

-- student_badges: Add explicit auth check and optimize
DROP POLICY IF EXISTS student_badges_authenticated_select ON student_badges;
CREATE POLICY student_badges_authenticated_select ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = student_badges.student_id
        AND c.teacher_id = (SELECT auth.uid())
      )
      OR
      (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
    )
  );

-- student_knowledge_state: Add explicit auth check and optimize
DROP POLICY IF EXISTS student_knowledge_state_authenticated_select ON student_knowledge_state;
CREATE POLICY student_knowledge_state_authenticated_select ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = student_knowledge_state.student_id
        AND c.teacher_id = (SELECT auth.uid())
      )
      OR
      (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
    )
  );

-- student_profiles: Add explicit auth check
DROP POLICY IF EXISTS student_profiles_authenticated_select ON student_profiles;
CREATE POLICY student_profiles_authenticated_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      user_id = (SELECT auth.uid())
      OR
      (
        is_teacher()
        AND user_id IN (SELECT get_teacher_student_ids())
      )
    )
  );

DROP POLICY IF EXISTS student_profile_self_update ON student_profiles;
CREATE POLICY student_profile_self_update ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

-- summative_results: Add explicit auth check
DROP POLICY IF EXISTS summative_results_authenticated_select ON summative_results;
CREATE POLICY summative_results_authenticated_select ON summative_results
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      student_id = (SELECT auth.uid())
      OR
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
    )
  );

-- teacher_profiles: Add explicit auth checks
DROP POLICY IF EXISTS teacher_self_read ON teacher_profiles;
CREATE POLICY teacher_self_read ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS teacher_self_update ON teacher_profiles;
CREATE POLICY teacher_self_update ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

-- usernames: Add explicit auth check
DROP POLICY IF EXISTS usernames_authenticated_select ON usernames;
CREATE POLICY usernames_authenticated_select ON usernames
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      true
      OR
      user_id = (SELECT auth.uid())
    )
  );

-- users: Add explicit auth checks
DROP POLICY IF EXISTS users_self_read ON users;
CREATE POLICY users_self_read ON users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND id = (SELECT auth.uid())
  );

-- learning_style_profile: Fix students_own_profile_update
DROP POLICY IF EXISTS students_own_profile_update ON learning_style_profile;
CREATE POLICY students_own_profile_update ON learning_style_profile
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND student_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND student_id = (SELECT auth.uid())
  );

-- student_knowledge_state: Fix students_own_knowledge_update
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND student_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND student_id = (SELECT auth.uid())
  );

