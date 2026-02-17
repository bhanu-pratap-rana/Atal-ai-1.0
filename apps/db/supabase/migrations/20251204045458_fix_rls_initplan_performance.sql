-- ============================================================================
-- FIX: RLS initplan performance optimization
-- ============================================================================

-- PART 1: USERS table policies
DROP POLICY IF EXISTS "users_self_read" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_read" ON public.users
  FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE
  USING (id = (select auth.uid()));

-- PART 2: CLASSES table policies
DROP POLICY IF EXISTS "classes_teacher_crud" ON public.classes;
DROP POLICY IF EXISTS "classes_student_read" ON public.classes;

CREATE POLICY "classes_teacher_crud" ON public.classes
  FOR ALL
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "classes_student_read" ON public.classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = (select auth.uid())
    )
  );

-- PART 3: ENROLLMENTS table policies
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
  FOR SELECT
  USING (student_id = (select auth.uid()));;
