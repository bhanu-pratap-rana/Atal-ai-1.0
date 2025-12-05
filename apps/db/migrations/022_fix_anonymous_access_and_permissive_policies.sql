-- ============================================================================
-- FIX: Anonymous Student Workflow + Security + Performance Optimization
-- ============================================================================
-- This migration:
-- 1. Supports anonymous sign-in for students ONLY (not teachers/admins)
-- 2. Anonymous students can join classes via PIN + class code
-- 3. Anonymous students can take assessments
-- 4. Teachers/admins must have permanent accounts (email/phone)
-- 5. Combines multiple SELECT policies into single policies using OR
-- 6. Uses initplan optimization: (select auth.uid()) instead of auth.uid()
--
-- SECURITY MODEL:
-- - Anonymous users: Can only be students, can enroll and take assessments
-- - Permanent users: Can be teachers/admins with full privileges
-- - Service role: Required for school_staff_credentials operations
-- ============================================================================

-- ============================================================================
-- PART 1: USERS table - all authenticated users can read/update own row
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
-- PART 2: CLASSES table - combined SELECT, teacher-only modifications
-- ============================================================================
DROP POLICY IF EXISTS "classes_teacher_crud" ON public.classes;
DROP POLICY IF EXISTS "classes_student_read" ON public.classes;
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;

-- Combined SELECT: Teachers see their classes, students (including anonymous) see enrolled classes
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

-- INSERT: Only permanent users (teachers) can create classes
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

-- UPDATE: Only permanent users (teachers) can update their classes
CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

-- DELETE: Only permanent users (teachers) can delete their classes
CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

-- ============================================================================
-- PART 3: ENROLLMENTS table - students can self-enroll, teachers manage
-- ============================================================================
DROP POLICY IF EXISTS "enrollments_teacher_manage" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;

-- Combined SELECT: Students see their enrollments, teachers see class enrollments
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

-- INSERT: Students can enroll themselves (via class code), teachers can enroll students
CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (select auth.uid())
    OR (
      (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
      AND EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = enrollments.class_id
        AND c.teacher_id = (select auth.uid())
      )
    )
  );

-- UPDATE: Only permanent teachers can update enrollments
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (
    (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- DELETE: Only permanent teachers can delete enrollments
CREATE POLICY "enrollments_delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (
    (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 4: TEACHER_PROFILES table - permanent users only
-- ============================================================================
DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

-- Only permanent users can have teacher profiles
CREATE POLICY "teacher_self_read" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

CREATE POLICY "teacher_self_update" ON public.teacher_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

CREATE POLICY "teacher_self_insert" ON public.teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

-- ============================================================================
-- PART 5: SCHOOLS table - all authenticated users can read
-- ============================================================================
DROP POLICY IF EXISTS "schools_read" ON public.schools;

CREATE POLICY "schools_read" ON public.schools
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- PART 6: SCHOOL_STAFF_CREDENTIALS - service_role only
-- ============================================================================
DROP POLICY IF EXISTS "staff_creds_read_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_service_only" ON public.school_staff_credentials;

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
-- PART 7: ASSESSMENT_SESSIONS - all students can take assessments
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can create their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can update their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Teachers can view sessions in their classes" ON public.assessment_sessions;
DROP POLICY IF EXISTS "assessment_sessions_select" ON public.assessment_sessions;
DROP POLICY IF EXISTS "assessment_sessions_insert" ON public.assessment_sessions;
DROP POLICY IF EXISTS "assessment_sessions_update" ON public.assessment_sessions;

-- Combined SELECT: Students see own sessions, teachers see class sessions
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

-- All students (including anonymous) can create assessment sessions
CREATE POLICY "assessment_sessions_insert" ON public.assessment_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- All students (including anonymous) can update their own sessions
CREATE POLICY "assessment_sessions_update" ON public.assessment_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 8: ASSESSMENT_RESPONSES - all students can submit responses
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Students can create their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Teachers can view responses in their classes" ON public.assessment_responses;
DROP POLICY IF EXISTS "assessment_responses_select" ON public.assessment_responses;
DROP POLICY IF EXISTS "assessment_responses_insert" ON public.assessment_responses;

-- Combined SELECT: Students see own responses, teachers see class responses
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

-- All students (including anonymous) can create responses
CREATE POLICY "assessment_responses_insert" ON public.assessment_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- ANONYMOUS STUDENT WORKFLOW:
-- 1. Student signs in anonymously (no email required)
-- 2. Student enters class code + PIN (provided by teacher via invite link)
-- 3. Student enrolls themselves in the class
-- 4. Student can take assessments and submit responses
--
-- SECURITY RESTRICTIONS:
-- - Anonymous users CANNOT: create/modify classes, manage other enrollments,
--   have teacher profiles, or access staff credentials
-- - Only permanent users (with email/phone) can be teachers/admins
--
-- PERFORMANCE OPTIMIZATIONS:
-- - All auth.uid() and auth.jwt() wrapped in (select ...) for initplan
-- - Combined multiple SELECT policies into single policies using OR
-- - Separate INSERT/UPDATE/DELETE policies for clarity
--
-- REMAINING ADVISOR WARNINGS (EXPECTED):
-- - auth_allow_anonymous_sign_ins: Expected - anonymous sign-in is intentional
--   for students without email addresses
-- - Some initplan warnings may persist for auth.jwt()->>'is_anonymous' checks
--   but we're using the official Supabase-recommended pattern
-- ============================================================================
