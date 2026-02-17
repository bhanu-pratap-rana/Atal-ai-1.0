-- ============================================================================
-- FIX: Anonymous Student Workflow with Class PIN/Code Join
-- ============================================================================
-- WORKFLOW:
-- 1. Anonymous sign-in is ONLY for students (not teachers/admins)
-- 2. Anonymous students join classes via PIN + class code (invite link)
-- 3. Teachers and admins MUST have real accounts (email/phone)
--
-- ACCESS RULES:
-- - users: All authenticated can read/update own record
-- - schools: All authenticated can read (for school selection UI)
-- - teacher_profiles: ONLY permanent users (is_anonymous = false)
-- - classes: Read for enrolled students, full CRUD for teachers (permanent only)
-- - enrollments: Students can join via class code, teachers manage
-- - assessments: All authenticated students (including anonymous) can take tests
-- - school_staff_credentials: Service role only (PIN verification)
-- ============================================================================

-- ============================================================================
-- PART 1: USERS table - all authenticated users can access own data
-- ============================================================================
DROP POLICY IF EXISTS "users_self_read" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_read" ON public.users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()));

-- ============================================================================
-- PART 2: SCHOOLS table - all authenticated can read (needed for UI)
-- ============================================================================
DROP POLICY IF EXISTS "schools_read" ON public.schools;

CREATE POLICY "schools_read" ON public.schools
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- PART 3: TEACHER_PROFILES - ONLY permanent users (teachers need real accounts)
-- ============================================================================
DROP POLICY IF EXISTS "teacher_self_read" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_self_insert" ON public.teacher_profiles;

-- Teachers must be permanent users (not anonymous)
CREATE POLICY "teacher_self_read" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

CREATE POLICY "teacher_self_update" ON public.teacher_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

CREATE POLICY "teacher_self_insert" ON public.teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

-- ============================================================================
-- PART 4: CLASSES table
-- - All enrolled students (including anonymous) can read their classes
-- - Only permanent teachers can create/update/delete classes
-- ============================================================================
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;

-- All authenticated (including anonymous students) can view classes they're in
CREATE POLICY "classes_select" ON public.classes
  FOR SELECT TO authenticated
  USING (
    teacher_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = (select auth.uid())
    )
  );

-- Only permanent teachers can create classes
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

-- Only permanent teachers can update their classes
CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

-- Only permanent teachers can delete their classes
CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (
    teacher_id = (select auth.uid())
    AND (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
  );

-- ============================================================================
-- PART 5: ENROLLMENTS table
-- - All students (including anonymous) can view their enrollments
-- - Students can join classes (INSERT) via class code (handled by server action)
-- - Only permanent teachers can manage enrollments
-- ============================================================================
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;

-- All students can view their own enrollments
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Students can enroll themselves (via class code join - server validates PIN)
-- This allows both anonymous and permanent students to join classes
CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (select auth.uid())
    OR (
      (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
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
    (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
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
    (select (auth.jwt()->>'is_anonymous'))::boolean IS NOT TRUE
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 6: ASSESSMENT_SESSIONS - all students (including anonymous) can take tests
-- ============================================================================
DROP POLICY IF EXISTS "assessment_sessions_select" ON public.assessment_sessions;
DROP POLICY IF EXISTS "assessment_sessions_insert" ON public.assessment_sessions;
DROP POLICY IF EXISTS "assessment_sessions_update" ON public.assessment_sessions;

-- All authenticated can view own sessions, teachers can view class sessions
CREATE POLICY "assessment_sessions_select" ON public.assessment_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assessment_sessions.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- All students (including anonymous) can start assessments
CREATE POLICY "assessment_sessions_insert" ON public.assessment_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- All students can update their own sessions (submit answers)
CREATE POLICY "assessment_sessions_update" ON public.assessment_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 7: ASSESSMENT_RESPONSES - all students (including anonymous)
-- ============================================================================
DROP POLICY IF EXISTS "assessment_responses_select" ON public.assessment_responses;
DROP POLICY IF EXISTS "assessment_responses_insert" ON public.assessment_responses;

-- All authenticated can view own responses, teachers can view class responses
CREATE POLICY "assessment_responses_select" ON public.assessment_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND (
        s.user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = s.class_id
          AND c.teacher_id = (select auth.uid())
        )
      )
    )
  );

-- All students can create responses
CREATE POLICY "assessment_responses_insert" ON public.assessment_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_responses.session_id
      AND s.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- NOTES:
-- - school_staff_credentials policies remain service_role only (unchanged)
-- - PIN verification happens via verify_staff_pin() function (service role)
-- - Class joining with PIN is handled by server action, not RLS
-- ============================================================================;
