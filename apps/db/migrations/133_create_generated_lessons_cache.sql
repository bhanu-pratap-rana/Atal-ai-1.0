-- =====================================================
-- Migration 133: Create generated_lessons cache table
-- =====================================================
--
-- NOTE: Renamed from 132 to resolve conflict with 132_fix_first_steps_badge.sql
--
-- This table caches AI-generated microlearning lessons
-- to avoid repeated API calls for the same content.
-- Lessons expire after 7 days by default.
--
-- =====================================================

-- Cache table for AI-generated lessons
CREATE TABLE IF NOT EXISTS generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'as')),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lesson_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

-- Composite unique constraint for caching
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_lessons_cache_key
  ON generated_lessons(module_id, topic_id, language)
  WHERE student_id IS NULL;

-- Index for expiry cleanup
CREATE INDEX IF NOT EXISTS idx_generated_lessons_expires
  ON generated_lessons(expires_at);

-- Index for per-student personalized lessons
CREATE INDEX IF NOT EXISTS idx_generated_lessons_student
  ON generated_lessons(student_id)
  WHERE student_id IS NOT NULL;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached lessons (they're not sensitive)
CREATE POLICY "generated_lessons_select_policy"
  ON generated_lessons
  FOR SELECT
  USING (true);

-- Service role can insert/update (API generates lessons)
CREATE POLICY "generated_lessons_insert_policy"
  ON generated_lessons
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "generated_lessons_update_policy"
  ON generated_lessons
  FOR UPDATE
  USING (true);

-- =====================================================
-- Cleanup function for expired lessons
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_lessons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM generated_lessons
  WHERE expires_at < now();
END;
$$;

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON TABLE generated_lessons IS 'Cache for AI-generated microlearning lessons';
COMMENT ON COLUMN generated_lessons.id IS 'Unique identifier for cached lesson';
COMMENT ON COLUMN generated_lessons.module_id IS 'Module ID (M1-M5)';
COMMENT ON COLUMN generated_lessons.topic_id IS 'Topic ID within module';
COMMENT ON COLUMN generated_lessons.language IS 'Language of generated lesson';
COMMENT ON COLUMN generated_lessons.student_id IS 'Optional student ID for personalized lessons';
COMMENT ON COLUMN generated_lessons.lesson_json IS 'Full lesson JSON with chunks, questions, etc.';
COMMENT ON COLUMN generated_lessons.created_at IS 'When lesson was generated';
COMMENT ON COLUMN generated_lessons.expires_at IS 'When cache entry expires (default 7 days)';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
