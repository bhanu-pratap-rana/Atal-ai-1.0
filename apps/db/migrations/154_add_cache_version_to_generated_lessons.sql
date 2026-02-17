-- Migration 154: Add cache_version column to generated_lessons
--
-- The lesson generation API uses cache_version to invalidate stale cached
-- lessons when the AI model, prompts, or generation logic changes.
-- This ensures students always get content generated with the latest logic.
--
-- Related code: apps/web/src/app/api/lesson/generate/route.ts (LESSON_CACHE_VERSION)

-- Add cache_version column with default value
ALTER TABLE generated_lessons
ADD COLUMN IF NOT EXISTS cache_version TEXT DEFAULT '1.0';

-- Add index for efficient cache version queries
CREATE INDEX IF NOT EXISTS idx_generated_lessons_cache_version
ON generated_lessons(cache_version);

-- Update comment
COMMENT ON COLUMN generated_lessons.cache_version IS 'Version string to invalidate stale cached lessons when generation logic changes';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
