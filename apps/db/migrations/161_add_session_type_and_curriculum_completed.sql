-- Migration 161: Add session_type to assessment_sessions and curriculum_completed to student_profiles
-- Part of Pre/Post Assessment feature (specs/pre-post-assessment/design.md)

-- 1. Add session_type column with backward-compatible default
ALTER TABLE assessment_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'adaptive'
  CHECK (session_type IN ('pre', 'adaptive', 'post'));

-- Index for querying pre/post sessions per user
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_type
  ON assessment_sessions(user_id, session_type);

-- 2. Add curriculum tracking to student_profiles
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS curriculum_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS curriculum_completed_at TIMESTAMPTZ;
