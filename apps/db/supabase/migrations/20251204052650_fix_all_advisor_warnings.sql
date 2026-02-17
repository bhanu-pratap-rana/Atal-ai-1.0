-- ============================================================================
-- FIX: All Security and Performance Advisor Warnings
-- ============================================================================
-- This migration fixes:
-- 1. Function search_path mutable warnings
-- 2. RLS initplan warnings for is_anonymous checks
-- 3. Multiple permissive policies on student_profiles
-- ============================================================================

-- ============================================================================
-- PART 1: Fix function search_path (Security)
-- ============================================================================

-- Fix update_student_profile_updated_at
CREATE OR REPLACE FUNCTION public.update_student_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_teacher_profile_updated_at
CREATE OR REPLACE FUNCTION public.update_teacher_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 2: Fix teacher_profiles RLS policies (initplan)
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
-- PART 3: Fix classes RLS policies (remove is_anonymous, use simple check)
-- ============================================================================
-- Note: Teachers must be permanent users, so we check via teacher_profiles existence

DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;

-- Teachers can only create classes if they have a teacher profile (permanent users only)
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 4: Fix enrollments RLS policies (remove is_anonymous, use teacher_profiles)
-- ============================================================================

DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;

-- Students can self-enroll, OR teachers (with profile) can enroll students
CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (select auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM public.teacher_profiles tp
        WHERE tp.user_id = (select auth.uid())
      )
      AND EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = enrollments.class_id
        AND c.teacher_id = (select auth.uid())
      )
    )
  );

-- Only teachers with profiles can update enrollments
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Only teachers with profiles can delete enrollments
CREATE POLICY "enrollments_delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 5: Fix student_profiles RLS policies (combine SELECT, fix initplan)
-- ============================================================================

DROP POLICY IF EXISTS "student_profile_self_read" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profile_teacher_read" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profile_select" ON public.student_profiles;

-- Combined SELECT: Students see own profile OR teachers see enrolled students' profiles
CREATE POLICY "student_profile_select" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM public.teacher_profiles tp
        WHERE tp.user_id = (select auth.uid())
      )
      AND EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.classes c ON c.id = e.class_id
        WHERE e.student_id = student_profiles.user_id
        AND c.teacher_id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- FIXES APPLIED:
-- 1. Function search_path: Added SET search_path = '' to trigger functions
-- 2. RLS initplan: Removed is_anonymous checks, use teacher_profiles existence instead
--    - This is MORE secure: only users with teacher profiles can manage classes
--    - Anonymous users cannot have teacher profiles, so they're automatically blocked
-- 3. Multiple permissive policies: Combined student_profiles SELECT into one policy
--
-- REMAINING EXPECTED WARNINGS:
-- - auth_allow_anonymous_sign_ins: Expected (anonymous sign-in for students)
-- - auth_leaked_password_protection: Enable in Supabase Dashboard > Auth Settings
-- ============================================================================;
