-- Migration: 028_fix_rls_with_security_definer_functions
-- Purpose: Complete fix for RLS infinite recursion by using SECURITY DEFINER helper functions
--
-- The previous migration (027) used IN subqueries instead of EXISTS, but this doesn't
-- fully resolve the circular dependency between classes and enrollments RLS policies.
--
-- Solution: Create SECURITY DEFINER functions that bypass RLS when evaluating policies.
-- These functions run with the privileges of the function owner (postgres) and bypass
-- RLS checks, breaking the circular dependency.

-- ============================================================
-- STEP 1: Create SECURITY DEFINER helper functions
-- ============================================================

-- Function to get class IDs where the current user is enrolled as a student
-- Bypasses RLS to prevent recursion when evaluating classes policy
CREATE OR REPLACE FUNCTION get_user_enrolled_class_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT class_id
  FROM enrollments
  WHERE student_id = auth.uid()
$$;

-- Function to get class IDs owned by the current user as a teacher
-- Bypasses RLS to prevent recursion when evaluating enrollments policy
CREATE OR REPLACE FUNCTION get_teacher_class_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
  FROM classes
  WHERE teacher_id = auth.uid()
$$;

-- Function to check if the current user is a teacher of a specific class
CREATE OR REPLACE FUNCTION is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
    AND teacher_id = auth.uid()
  )
$$;

-- Function to check if the current user is enrolled in a specific class
CREATE OR REPLACE FUNCTION is_enrolled_in_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE class_id = p_class_id
    AND student_id = auth.uid()
  )
$$;

-- ============================================================
-- STEP 2: Drop existing problematic policies
-- ============================================================

-- Drop all classes SELECT policies
DROP POLICY IF EXISTS "classes_select" ON classes;
DROP POLICY IF EXISTS "classes_teacher_read" ON classes;
DROP POLICY IF EXISTS "classes_student_read" ON classes;

-- Drop existing enrollments SELECT policy
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;

-- ============================================================
-- STEP 3: Create new RLS policies using SECURITY DEFINER functions
-- ============================================================

-- Classes: Teachers can see their own classes
CREATE POLICY "classes_teacher_select" ON classes
FOR SELECT USING (
  teacher_id = auth.uid()
);

-- Classes: Students can see classes they're enrolled in
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "classes_student_select" ON classes
FOR SELECT USING (
  id IN (SELECT get_user_enrolled_class_ids())
);

-- Enrollments: Students can see their own enrollments
CREATE POLICY "enrollments_student_select" ON enrollments
FOR SELECT USING (
  student_id = auth.uid()
);

-- Enrollments: Teachers can see enrollments for classes they own
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "enrollments_teacher_select" ON enrollments
FOR SELECT USING (
  class_id IN (SELECT get_teacher_class_ids())
);

-- ============================================================
-- STEP 4: Grant execute permissions on helper functions
-- ============================================================

GRANT EXECUTE ON FUNCTION get_user_enrolled_class_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_class_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION is_class_teacher(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_enrolled_in_class(UUID) TO authenticated;

-- ============================================================
-- STEP 5: Add comments for documentation
-- ============================================================

COMMENT ON FUNCTION get_user_enrolled_class_ids() IS
  'Returns class IDs where the current user is enrolled. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_teacher_class_ids() IS
  'Returns class IDs owned by the current user as teacher. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION is_class_teacher(UUID) IS
  'Checks if current user is the teacher of a specific class. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION is_enrolled_in_class(UUID) IS
  'Checks if current user is enrolled in a specific class. SECURITY DEFINER to bypass RLS.';

-- ============================================================
-- STEP 6: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';
