-- ============================================================================
-- FIX: Proper initplan wrapping for is_anonymous checks
-- ============================================================================
-- The issue is that (auth.jwt()->>'is_anonymous')::boolean needs the entire
-- expression wrapped in a single select to be evaluated once.
-- ============================================================================

-- ============================================================================
-- PART 1: TEACHER_PROFILES
-- ============================================================================
DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

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
-- PART 2: CLASSES write policies
-- ============================================================================
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;

CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
  );

-- ============================================================================
-- PART 3: ENROLLMENTS write policies
-- ============================================================================
DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;

-- Students can enroll themselves (any student including anonymous via class code)
-- Teachers (permanent only) can also enroll students
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

-- Only permanent teachers can update enrollments
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

-- Only permanent teachers can delete enrollments
CREATE POLICY "enrollments_delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (
    (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );;
