-- Migration: 029_fix_student_profiles_rls_initplan
-- Purpose: Fix RLS initplan performance issues for student_profiles table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "student_profile_self_select" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_insert" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_update" ON student_profiles;

-- Create optimized policies using (SELECT auth.uid())
CREATE POLICY "student_profile_self_select" ON student_profiles
FOR SELECT USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "student_profile_self_insert" ON student_profiles
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "student_profile_self_update" ON student_profiles
FOR UPDATE USING (
  user_id = (SELECT auth.uid())
) WITH CHECK (
  user_id = (SELECT auth.uid())
);

NOTIFY pgrst, 'reload schema';;
