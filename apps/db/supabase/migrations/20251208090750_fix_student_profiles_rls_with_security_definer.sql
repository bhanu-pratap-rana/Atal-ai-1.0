
-- Migration: fix_student_profiles_rls_with_security_definer
-- Purpose: Fix student_profiles RLS policies to use SECURITY DEFINER functions
-- This prevents potential recursive policy issues and ensures reliable profile operations

-- ============================================================
-- STEP 1: Create helper function for checking if user is a teacher
-- ============================================================

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teacher_profiles
    WHERE user_id = auth.uid()
  )
$$;

-- Function to get student IDs enrolled in teacher's classes
CREATE OR REPLACE FUNCTION get_teacher_student_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT e.student_id
  FROM enrollments e
  JOIN classes c ON c.id = e.class_id
  WHERE c.teacher_id = auth.uid()
$$;

-- ============================================================
-- STEP 2: Grant execute permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_student_ids() TO authenticated;

-- ============================================================
-- STEP 3: Drop existing student_profiles policies
-- ============================================================

DROP POLICY IF EXISTS "student_profile_select" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_read" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_teacher_read" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_insert" ON student_profiles;
DROP POLICY IF EXISTS "student_profile_self_update" ON student_profiles;

-- ============================================================
-- STEP 4: Create new optimized RLS policies
-- ============================================================

-- Students can read their own profile
CREATE POLICY "student_profile_self_select" ON student_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Teachers can read profiles of students in their classes
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "student_profile_teacher_select" ON student_profiles
FOR SELECT TO authenticated
USING (
  is_teacher() AND user_id IN (SELECT get_teacher_student_ids())
);

-- Students can insert their own profile
CREATE POLICY "student_profile_self_insert" ON student_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Students can update their own profile
CREATE POLICY "student_profile_self_update" ON student_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 5: Add comments
-- ============================================================

COMMENT ON FUNCTION is_teacher() IS 
  'Checks if current user has a teacher profile. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_teacher_student_ids() IS 
  'Returns student IDs enrolled in classes owned by current teacher. SECURITY DEFINER to bypass RLS.';

-- ============================================================
-- STEP 6: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';
;
