-- =====================================================
-- Migration: Fix RLS InitPlan Performance Issues
-- =====================================================
-- 
-- Wrap all auth.uid() and auth.jwt() calls in (SELECT ...)
-- to prevent re-evaluation for each row. This significantly
-- improves query performance at scale.
-- =====================================================

-- =====================================================
-- PART 1: student_knowledge_state
-- =====================================================

DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_insert ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;

CREATE POLICY students_own_knowledge_select ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_knowledge_insert ON student_knowledge_state
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_knowledge ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_knowledge ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 2: student_badges
-- =====================================================

DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS students_own_badges_insert ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;
DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;

CREATE POLICY students_own_badges_select ON student_badges
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_badges_insert ON student_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_badges ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_badges ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 3: ai_tutor_interactions
-- =====================================================

DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS students_own_interactions_insert ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;

CREATE POLICY students_own_interactions_select ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_interactions_insert ON ai_tutor_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_interactions ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ai_tutor_interactions.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_interactions ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
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

CREATE POLICY students_own_profile_select ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_profile_insert ON learning_style_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_profile_update ON learning_style_profile
  FOR UPDATE
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_profile ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_style_profile.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_view_all_profiles ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 5: points_history
-- =====================================================

DROP POLICY IF EXISTS students_own_points_select ON points_history;
DROP POLICY IF EXISTS teachers_view_student_points ON points_history;

CREATE POLICY students_own_points_select ON points_history
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_points ON points_history
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 6: formative_responses
-- =====================================================

DROP POLICY IF EXISTS students_own_formative_select ON formative_responses;
DROP POLICY IF EXISTS students_own_formative_insert ON formative_responses;
DROP POLICY IF EXISTS teachers_view_student_formative ON formative_responses;

CREATE POLICY students_own_formative_select ON formative_responses
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY students_own_formative_insert ON formative_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_formative ON formative_responses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 7: summative_results
-- =====================================================

DROP POLICY IF EXISTS students_own_summative_select ON summative_results;
DROP POLICY IF EXISTS teachers_view_student_summative ON summative_results;

CREATE POLICY students_own_summative_select ON summative_results
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teachers_view_student_summative ON summative_results
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 8: student_profiles
-- =====================================================

DROP POLICY IF EXISTS student_profile_self_select ON student_profiles;
DROP POLICY IF EXISTS student_profile_self_insert ON student_profiles;
DROP POLICY IF EXISTS student_profile_self_update ON student_profiles;
DROP POLICY IF EXISTS student_profile_teacher_select ON student_profiles;

CREATE POLICY student_profile_self_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY student_profile_self_insert ON student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY student_profile_self_update ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY student_profile_teacher_select ON student_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    is_teacher() AND
    user_id IN (SELECT get_teacher_student_ids())
  );

-- =====================================================
-- PART 9: assessment_responses
-- =====================================================

DROP POLICY IF EXISTS assessment_responses_select ON assessment_responses;

CREATE POLICY assessment_responses_select ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      user_id = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM assessment_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE s.id = assessment_responses.session_id
        AND c.teacher_id = (SELECT auth.uid())
      )
    )
  );

-- =====================================================
-- PART 10: assessment_sessions
-- =====================================================

DROP POLICY IF EXISTS assessment_sessions_select ON assessment_sessions;
DROP POLICY IF EXISTS assessment_sessions_update ON assessment_sessions;

CREATE POLICY assessment_sessions_select ON assessment_sessions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      user_id = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = assessment_sessions.class_id
        AND c.teacher_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY assessment_sessions_update ON assessment_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 11: classes
-- =====================================================

DROP POLICY IF EXISTS classes_select ON classes;
DROP POLICY IF EXISTS classes_join_lookup ON classes;

CREATE POLICY classes_select ON classes
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      teacher_id = (SELECT auth.uid()) OR
      id IN (SELECT get_user_enrolled_class_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY classes_join_lookup ON classes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 12: enrollments
-- =====================================================

DROP POLICY IF EXISTS enrollments_select ON enrollments;
DROP POLICY IF EXISTS enrollments_delete ON enrollments;
DROP POLICY IF EXISTS enrollments_update ON enrollments;

CREATE POLICY enrollments_select ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      student_id = (SELECT auth.uid()) OR
      class_id IN (SELECT get_teacher_class_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY enrollments_delete ON enrollments
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = (SELECT auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 13: schools
-- =====================================================

DROP POLICY IF EXISTS schools_read ON schools;

CREATE POLICY schools_read ON schools
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 14: teacher_profiles
-- =====================================================

DROP POLICY IF EXISTS teacher_self_read ON teacher_profiles;
DROP POLICY IF EXISTS teacher_self_update ON teacher_profiles;

CREATE POLICY teacher_self_read ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY teacher_self_update ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 15: users (public schema)
-- =====================================================

DROP POLICY IF EXISTS users_self_read ON users;
DROP POLICY IF EXISTS users_self_update ON users;

CREATE POLICY users_self_read ON users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  WITH CHECK (id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 16: irt_item_bank
-- =====================================================

DROP POLICY IF EXISTS irt_item_bank_admin_all ON irt_item_bank;
DROP POLICY IF EXISTS irt_item_bank_authenticated_read ON irt_item_bank;

CREATE POLICY irt_item_bank_admin_all ON irt_item_bank
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT auth.uid()) = created_by
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT auth.uid()) = created_by
  );

CREATE POLICY irt_item_bank_authenticated_read ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    is_active = true AND
    review_state = 'approved'
  );

-- =====================================================
-- PART 17: practice_questions (admin policy only)
-- =====================================================

DROP POLICY IF EXISTS admin_manage_practice_questions ON practice_questions;

CREATE POLICY admin_manage_practice_questions ON practice_questions
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- PART 18: badges (admin policy only)
-- =====================================================

DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;

CREATE POLICY admin_manage_cultural_badges ON badges
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );;
