-- Migration: 027_fix_classes_rls_infinite_recursion
-- Purpose: Fix infinite recursion in classes RLS policy caused by circular reference with enrollments
-- The classes_select policy was checking enrollments, and enrollments_select was checking classes
-- This caused PostgreSQL error: "infinite recursion detected in policy for relation 'classes'"

-- Drop the problematic policies
DROP POLICY IF EXISTS "classes_select" ON classes;
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;

-- Recreate classes_select WITHOUT checking enrollments via EXISTS (to break the cycle)
-- Uses IN subquery which doesn't trigger the same recursive policy evaluation
CREATE POLICY "classes_select" ON classes
FOR SELECT USING (
  -- Teacher can see their own classes
  teacher_id = (SELECT auth.uid())
  OR
  -- Student can see classes they're enrolled in (use IN instead of EXISTS)
  id IN (
    SELECT class_id FROM enrollments
    WHERE student_id = (SELECT auth.uid())
  )
);

-- Recreate enrollments_select WITHOUT circular reference to classes
-- Uses IN subquery instead of EXISTS with classes reference
CREATE POLICY "enrollments_select" ON enrollments
FOR SELECT USING (
  -- Student can see their own enrollments
  student_id = (SELECT auth.uid())
  OR
  -- Teacher can see enrollments for classes they own
  class_id IN (
    SELECT id FROM classes
    WHERE teacher_id = (SELECT auth.uid())
  )
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
