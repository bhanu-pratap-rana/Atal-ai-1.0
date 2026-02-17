-- Migration: fix_rls_recursion_v2
-- Purpose: Completely break the circular RLS dependency between classes and enrollments
-- Solution: Use SECURITY DEFINER functions to bypass RLS when checking cross-table relationships

-- First, create helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_enrolled_class_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT class_id FROM enrollments WHERE student_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_class_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM classes WHERE teacher_id = p_user_id;
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION public.get_user_enrolled_class_ids(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_class_ids(UUID) TO authenticated, anon;

-- Drop and recreate the policies using the helper functions
DROP POLICY IF EXISTS "classes_select" ON classes;
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;

-- Classes: Teacher sees own classes, students see enrolled classes (via function)
CREATE POLICY "classes_select" ON classes
FOR SELECT USING (
  teacher_id = (SELECT auth.uid())
  OR
  id IN (SELECT public.get_user_enrolled_class_ids((SELECT auth.uid())))
);

-- Enrollments: Student sees own enrollments, teacher sees enrollments for their classes (via function)
CREATE POLICY "enrollments_select" ON enrollments
FOR SELECT USING (
  student_id = (SELECT auth.uid())
  OR
  class_id IN (SELECT public.get_teacher_class_ids((SELECT auth.uid())))
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';;
