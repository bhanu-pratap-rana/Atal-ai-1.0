-- =====================================================
-- Migration 159: Fix teacher RLS on assessment tables
-- =====================================================
--
-- Problem: The combined SELECT policies on assessment_sessions and
-- assessment_responses include teacher access via class_id JOIN:
--   EXISTS (SELECT 1 FROM classes c WHERE c.id = assessment_sessions.class_id ...)
-- But class_id is often NULL (students start assessments from
-- dashboard, not via a class-specific link), so teachers see 0 rows.
--
-- Fix: Replace class_id-based teacher access with enrollment-based
-- access. Teachers can view assessment data for any student enrolled
-- in their classes, regardless of whether the session has class_id set.
--
-- Affected policies (actual names from DB):
--   - assessment_sessions_select (combined student + teacher)
--   - assessment_responses_select (combined student + teacher)
-- =====================================================

-- Drop the existing combined SELECT policies
DROP POLICY IF EXISTS "assessment_sessions_select" ON assessment_sessions;
DROP POLICY IF EXISTS "assessment_responses_select" ON assessment_responses;

-- Also drop legacy named policies in case they exist from partial migrations
DROP POLICY IF EXISTS "Teachers can view sessions in their classes" ON assessment_sessions;
DROP POLICY IF EXISTS "Teachers can view responses in their classes" ON assessment_responses;

-- Recreate assessment_sessions SELECT with enrollment-based teacher access
CREATE POLICY "assessment_sessions_select"
  ON assessment_sessions
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL)
    AND (
      -- Students can view their own sessions
      user_id = auth.uid()
      OR
      -- Teachers can view sessions from students enrolled in their classes
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = assessment_sessions.user_id
        AND c.teacher_id = auth.uid()
      )
    )
  );

-- Recreate assessment_responses SELECT with enrollment-based teacher access
CREATE POLICY "assessment_responses_select"
  ON assessment_responses
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL)
    AND (
      -- Students can view their own responses
      user_id = auth.uid()
      OR
      -- Teachers can view responses from students enrolled in their classes
      EXISTS (
        SELECT 1 FROM assessment_sessions s
        JOIN enrollments e ON e.student_id = s.user_id
        JOIN classes c ON c.id = e.class_id
        WHERE s.id = assessment_responses.session_id
        AND c.teacher_id = auth.uid()
      )
    )
  );

-- Documentation
COMMENT ON POLICY "assessment_sessions_select" ON assessment_sessions
  IS 'Students see own sessions; teachers see sessions from enrolled students (enrollment-based, not class_id-based)';

COMMENT ON POLICY "assessment_responses_select" ON assessment_responses
  IS 'Students see own responses; teachers see responses from enrolled students (enrollment-based, not class_id-based)';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
