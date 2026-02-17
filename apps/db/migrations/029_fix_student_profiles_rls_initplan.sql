-- Migration: 029_fix_student_profiles_rls_initplan
-- Purpose: Fix RLS initplan performance issues for student_profiles table
--
-- The Supabase advisor shows that student_profiles policies re-evaluate auth.uid()
-- for each row, which is suboptimal. This migration fixes by using (SELECT auth.uid())
-- pattern which evaluates once per query.

-- ============================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================

DROP POLICY IF EXISTS "student_profile_self_select" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_insert" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_update" ON student_profiles;

-- ============================================================
-- STEP 2: Create optimized policies using (SELECT auth.uid())
-- ============================================================

-- Students can view their own profile
CREATE POLICY "student_profile_self_select" ON student_profiles
FOR SELECT USING (
  user_id = (SELECT auth.uid())
);

-- Students can create their own profile
CREATE POLICY "student_profile_self_insert" ON student_profiles
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- Students can update their own profile
CREATE POLICY "student_profile_self_update" ON student_profiles
FOR UPDATE USING (
  user_id = (SELECT auth.uid())
) WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- ============================================================
-- STEP 3: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';
