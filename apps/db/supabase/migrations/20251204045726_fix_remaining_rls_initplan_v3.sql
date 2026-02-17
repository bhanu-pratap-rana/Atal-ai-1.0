-- ============================================================================
-- FIX: Remaining RLS initplan performance + cleanup duplicate policies
-- ============================================================================

-- PART 1: TEACHER_PROFILES table policies
DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

CREATE POLICY "teacher_self_read" ON public.teacher_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_update" ON public.teacher_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "teacher_self_insert" ON public.teacher_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- PART 2: SCHOOLS table policies (simple - just allow all authenticated)
DROP POLICY IF EXISTS "schools_read" ON public.schools;

CREATE POLICY "schools_read" ON public.schools
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- PART 3: ASSESSMENT_SESSIONS table policies (uses user_id not student_id)
DROP POLICY IF EXISTS "Students can view their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can create their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Students can update their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Teachers can view sessions in their classes" ON public.assessment_sessions;

CREATE POLICY "Students can view their own assessment sessions" ON public.assessment_sessions
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Students can create their own assessment sessions" ON public.assessment_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Students can update their own assessment sessions" ON public.assessment_sessions
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Teachers can view sessions in their classes" ON public.assessment_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assessment_sessions.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- PART 4: ASSESSMENT_RESPONSES table policies
DROP POLICY IF EXISTS "Students can view their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Students can create their own assessment responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Teachers can view responses in their classes" ON public.assessment_responses;

CREATE POLICY "Students can view their own assessment responses" ON public.assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Students can create their own assessment responses" ON public.assessment_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can view responses in their classes" ON public.assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = assessment_responses.session_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- PART 5: Remove duplicate classes policies (keep only the unified ones from first migration)
DROP POLICY IF EXISTS "classes_teacher_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_update" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_delete" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_read" ON public.classes;;
