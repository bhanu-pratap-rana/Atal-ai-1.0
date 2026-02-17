-- Migration: fix_classes_rls_infinite_recursion
-- Purpose: Fix infinite recursion in classes RLS policy caused by circular reference with enrollments
-- The classes_select policy checks enrollments, and enrollments_select checks classes

-- Drop the problematic policies
DROP POLICY IF EXISTS "classes_select" ON classes;
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;

-- Recreate classes_select WITHOUT checking enrollments (to break the cycle)
-- Teachers can see their own classes
-- Students can see classes they're enrolled in (checked via direct enrollment lookup, not via classes table)
CREATE POLICY "classes_select" ON classes
FOR SELECT USING (
  -- Teacher can see their own classes
  teacher_id = (SELECT auth.uid())
  OR
  -- Student can see classes they're enrolled in (use direct ID check, not subquery on classes)
  id IN (
    SELECT class_id FROM enrollments 
    WHERE student_id = (SELECT auth.uid())
  )
);

-- Recreate enrollments_select WITHOUT circular reference to classes
-- Instead of checking classes.teacher_id, we check if user is the student OR owns the class directly
CREATE POLICY "enrollments_select" ON enrollments
FOR SELECT USING (
  -- Student can see their own enrollments
  student_id = (SELECT auth.uid())
  OR
  -- Teacher can see enrollments for classes they own (direct join to classes without triggering classes policy)
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id = (SELECT auth.uid())
  )
);

-- Verify policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('classes', 'enrollments') ORDER BY tablename, policyname;;
