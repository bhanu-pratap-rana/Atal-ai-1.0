-- =====================================================
-- Migration: Fix Remaining Anonymous Access Issues
-- =====================================================
-- 
-- Fix remaining tables that still allow anonymous access:
-- - assessment_responses
-- - assessment_sessions
-- - classes (classes_join_lookup)
-- - enrollments (delete/update operations)
-- - schools
-- - teacher_profiles
-- - users (public schema)
-- =====================================================

-- =====================================================
-- PART 1: assessment_responses
-- =====================================================

DROP POLICY IF EXISTS assessment_responses_select ON assessment_responses;

-- Authenticated users can view their own responses or teachers can view their students' responses
CREATE POLICY assessment_responses_select ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM assessment_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE s.id = assessment_responses.session_id
        AND c.teacher_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PART 2: assessment_sessions
-- =====================================================

DROP POLICY IF EXISTS assessment_sessions_select ON assessment_sessions;
DROP POLICY IF EXISTS assessment_sessions_update ON assessment_sessions;

-- Authenticated users can view their own sessions or teachers can view their students' sessions
CREATE POLICY assessment_sessions_select ON assessment_sessions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = assessment_sessions.class_id
        AND c.teacher_id = auth.uid()
      )
    )
  );

-- Authenticated users can update their own sessions
CREATE POLICY assessment_sessions_update ON assessment_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- =====================================================
-- PART 3: classes (fix classes_join_lookup)
-- =====================================================

DROP POLICY IF EXISTS classes_join_lookup ON classes;

-- Authenticated users can lookup classes by code/pin for joining
CREATE POLICY classes_join_lookup ON classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- PART 4: enrollments (fix delete/update)
-- =====================================================

DROP POLICY IF EXISTS enrollments_delete ON enrollments;
DROP POLICY IF EXISTS enrollments_update ON enrollments;

-- Teachers can delete enrollments from their classes (authenticated only)
CREATE POLICY enrollments_delete ON enrollments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update enrollments in their classes (authenticated only)
CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- PART 5: schools (intentionally public for signup, but restrict to authenticated)
-- =====================================================

DROP POLICY IF EXISTS schools_read ON schools;

-- Authenticated users can read schools (needed for signup/profile)
CREATE POLICY schools_read ON schools
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- PART 6: teacher_profiles
-- =====================================================

DROP POLICY IF EXISTS teacher_self_read ON teacher_profiles;
DROP POLICY IF EXISTS teacher_self_update ON teacher_profiles;

-- Teachers can view their own profile (authenticated only)
CREATE POLICY teacher_self_read ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Teachers can update their own profile (authenticated only)
CREATE POLICY teacher_self_update ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- =====================================================
-- PART 7: users (public schema)
-- =====================================================

DROP POLICY IF EXISTS users_self_read ON users;
DROP POLICY IF EXISTS users_self_update ON users;

-- Users can view their own record (authenticated only)
CREATE POLICY users_self_read ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND auth.uid() IS NOT NULL);

-- Users can update their own record (authenticated only)
CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND auth.uid() IS NOT NULL)
  WITH CHECK (id = auth.uid() AND auth.uid() IS NOT NULL);;
