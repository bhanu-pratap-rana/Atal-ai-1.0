-- ============================================================================
-- FIX: RLS initplan performance optimization
-- ============================================================================
-- PostgreSQL's query planner evaluates auth.uid() once per row in RLS policies.
-- Wrapping in (select auth.uid()) forces a single evaluation (initplan).
-- This is a Supabase-recommended best practice for RLS performance.
-- ============================================================================

-- ============================================================================
-- PART 1: Drop and recreate USERS table policies
-- ============================================================================

DROP POLICY IF EXISTS "users_self_read" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_read" ON public.users
  FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (id = (select auth.uid()));

-- ============================================================================
-- PART 2: Drop and recreate CLASSES table policies
-- ============================================================================

DROP POLICY IF EXISTS "classes_teacher_crud" ON public.classes;
DROP POLICY IF EXISTS "classes_student_read" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_update" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_delete" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_read" ON public.classes;

CREATE POLICY "classes_teacher_crud" ON public.classes
  FOR ALL
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "classes_student_read" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 3: Drop and recreate ENROLLMENTS table policies
-- ============================================================================

DROP POLICY IF EXISTS "enrollments_teacher_manage" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;

CREATE POLICY "enrollments_teacher_manage" ON public.enrollments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

CREATE POLICY "enrollments_student_read" ON public.enrollments
  FOR SELECT USING (student_id = (select auth.uid()));

-- ============================================================================
-- PART 4: Drop and recreate TEACHER_PROFILES table policies
-- ============================================================================

DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

CREATE POLICY "teacher_self_read" ON public.teacher_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_update" ON public.teacher_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_insert" ON public.teacher_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- PART 5: Drop and recreate SCHOOLS table policies
-- ============================================================================

DROP POLICY IF EXISTS "schools_read" ON public.schools;

CREATE POLICY "schools_read" ON public.schools
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- ============================================================================
-- PART 6: Drop and recreate SCHOOL_STAFF_CREDENTIALS table policies
-- ============================================================================

DROP POLICY IF EXISTS "staff_creds_read_for_verification" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_for_admins" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_for_admins" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_read_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_service_only" ON public.school_staff_credentials;

CREATE POLICY "staff_creds_read_service_only" ON public.school_staff_credentials
  FOR SELECT USING ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_insert_service_only" ON public.school_staff_credentials
  FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_update_service_only" ON public.school_staff_credentials
  FOR UPDATE USING ((select auth.jwt()) ->> 'role' = 'service_role');

-- ============================================================================
-- PART 7: Drop and recreate ASSESSMENT_SESSIONS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Students can view their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can create their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can update their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Teachers can view sessions in their classes" ON public.assessment_sessions;

CREATE POLICY "Students can view their own assessment sessions" ON public.assessment_sessions
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Students can create their own assessment sessions" ON public.assessment_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Students can update their own assessment sessions" ON public.assessment_sessions
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Teachers can view sessions in their classes" ON public.assessment_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assessment_sessions.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 8: Drop and recreate ASSESSMENT_RESPONSES table policies
-- ============================================================================

DROP POLICY IF EXISTS "Students can view their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Students can create their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Teachers can view responses in their classes" ON public.assessment_responses;

CREATE POLICY "Students can view their own assessment responses" ON public.assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Students can create their own assessment responses" ON public.assessment_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can view responses in their classes" ON public.assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = assessment_responses.session_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- CHANGES:
-- 1. Wrapped all auth.uid() and auth.jwt() calls in (select ...) for initplan
-- 2. Policies now evaluate auth functions once per query instead of per row
-- 3. No functional changes - same security, better performance
-- 4. Cleaned up duplicate policies on classes table
--
-- PERFORMANCE IMPACT:
-- - Significant improvement for tables with many rows
-- - Query plans will show "InitPlan" instead of "Filter" for auth checks
-- ============================================================================
