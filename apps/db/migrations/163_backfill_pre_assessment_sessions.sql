-- Migration 163: Backfill session_type for pre-existing assessment sessions
--
-- Problem: Migration 161 added session_type with DEFAULT 'adaptive'.
-- All sessions created BEFORE that migration got session_type='adaptive',
-- even if they were the student's first-ever assessment (effectively a pre-assessment).
-- This causes has_assessment_type('pre') to return FALSE for students who
-- already took assessments before the pre/post feature was added.
--
-- Fix: For each student, set their OLDEST completed assessment to session_type='pre'.
-- This ensures has_assessment_type('pre') returns TRUE for existing students.

-- Step 1: Backfill oldest completed session per student as 'pre'
-- Only updates sessions that are currently 'adaptive' (not already 'pre' or 'post')
WITH oldest_sessions AS (
  SELECT DISTINCT ON (user_id) id
  FROM assessment_sessions
  WHERE submitted_at IS NOT NULL
    AND session_type = 'adaptive'
  ORDER BY user_id, submitted_at ASC
)
UPDATE assessment_sessions
SET session_type = 'pre'
WHERE id IN (SELECT id FROM oldest_sessions);

-- Step 2: Update has_assessment_type to also check for legacy sessions as fallback
-- If a student has ANY completed session, treat them as having a pre-assessment
-- This handles edge cases where the backfill might miss something
CREATE OR REPLACE FUNCTION has_assessment_type(p_user_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct check: does a session with this exact type exist?
  IF EXISTS (
    SELECT 1 FROM assessment_sessions
    WHERE user_id = p_user_id
      AND session_type = p_type
      AND submitted_at IS NOT NULL
  ) THEN
    RETURN TRUE;
  END IF;

  -- Fallback for 'pre': if student has ANY completed session, they've done an assessment
  -- This handles legacy students whose sessions weren't tagged as 'pre'
  IF p_type = 'pre' THEN
    RETURN EXISTS (
      SELECT 1 FROM assessment_sessions
      WHERE user_id = p_user_id
        AND submitted_at IS NOT NULL
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
