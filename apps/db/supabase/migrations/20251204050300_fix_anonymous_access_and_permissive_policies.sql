-- ============================================================================
-- FIX: Anonymous Access Security + Multiple Permissive Policies Performance
-- ============================================================================
-- This migration:
-- 1. Restricts all policies to 'authenticated' role only (no anon access)
-- 2. Combines multiple SELECT policies into single unified policies using OR
-- ============================================================================

-- ============================================================================
-- PART 1: USERS table - restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "users_self_read" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_read" ON public.users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()));

-- ============================================================================
-- PART 2: CLASSES table - combine student/teacher SELECT into one policy
-- ============================================================================
DROP POLICY IF EXISTS "classes_teacher_crud" ON public.classes;
DROP POLICY IF EXISTS "classes_student_read" ON public.classes;

-- Combined SELECT policy for both teachers and students
CREATE POLICY "classes_select" ON public.classes
  FOR SELECT TO authenticated
  USING (
    teacher_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = (select auth.uid())
    )
  );

-- Separate policies for INSERT, UPDATE, DELETE (teacher only)
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (teacher_id = (select auth.uid()));

CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (teacher_id = (select auth.uid()));

-- ============================================================================
-- PART 3: ENROLLMENTS table - combine student/teacher SELECT into one policy
-- ============================================================================
DROP POLICY IF EXISTS "enrollments_teacher_manage" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;

-- Combined SELECT policy
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher-only INSERT
CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher-only UPDATE
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher-only DELETE
CREATE POLICY "enrollments_delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 4: TEACHER_PROFILES table - restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

CREATE POLICY "teacher_self_read" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_update" ON public.teacher_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_insert" ON public.teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- PART 5: SCHOOLS table - restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "schools_read" ON public.schools;

CREATE POLICY "schools_read" ON public.schools
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- PART 6: SCHOOL_STAFF_CREDENTIALS - already service_role only, just ensure TO clause
-- ============================================================================
DROP POLICY IF EXISTS "staff_creds_read_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_service_only" ON public.school_staff_credentials;

-- Service role policies don't need TO clause as they check JWT role
CREATE POLICY "staff_creds_read_service_only" ON public.school_staff_credentials
  FOR SELECT
  USING ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_insert_service_only" ON public.school_staff_credentials
  FOR INSERT
  WITH CHECK ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_update_service_only" ON public.school_staff_credentials
  FOR UPDATE
  USING ((select auth.jwt()) ->> 'role' = 'service_role');

-- ============================================================================
-- PART 7: ASSESSMENT_SESSIONS - combine into single SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can create their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can update their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Teachers can view sessions in their classes" ON public.assessment_sessions;

-- Combined SELECT for students and teachers
CREATE POLICY "assessment_sessions_select" ON public.assessment_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assessment_sessions.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Student INSERT
CREATE POLICY "assessment_sessions_insert" ON public.assessment_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Student UPDATE
CREATE POLICY "assessment_sessions_update" ON public.assessment_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 8: ASSESSMENT_RESPONSES - combine into single SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Students can create their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Teachers can view responses in their classes" ON public.assessment_responses;

-- Combined SELECT for students and teachers
CREATE POLICY "assessment_responses_select" ON public.assessment_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND (
        s.user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = s.class_id
          AND c.teacher_id = (select auth.uid())
        )
      )
    )
  );

-- Student INSERT
CREATE POLICY "assessment_responses_insert" ON public.assessment_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );;
