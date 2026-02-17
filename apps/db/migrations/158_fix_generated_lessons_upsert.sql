-- =====================================================
-- Migration 158: Fix generated_lessons upsert
-- =====================================================
--
-- Problem: Supabase JS client's .upsert() with onConflict
-- cannot use partial unique indexes. The existing partial
-- index idx_generated_lessons_cache_key uses
-- WHERE student_id IS NULL, which causes:
--   "there is no unique or exclusion constraint matching
--    the ON CONFLICT specification"
--
-- Fix: Create an RPC function that uses PostgreSQL's native
-- INSERT ... ON CONFLICT ... WHERE syntax, which supports
-- partial indexes.
--
-- This preserves the original schema design allowing future
-- per-student personalized lesson caching.
--
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_generated_lesson(
  p_module_id TEXT,
  p_topic_id TEXT,
  p_language TEXT,
  p_lesson_json JSONB,
  p_cache_version TEXT DEFAULT '1.0',
  p_expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO generated_lessons (module_id, topic_id, language, lesson_json, cache_version, expires_at)
  VALUES (p_module_id, p_topic_id, p_language, p_lesson_json, p_cache_version, p_expires_at)
  ON CONFLICT (module_id, topic_id, language) WHERE student_id IS NULL
  DO UPDATE SET
    lesson_json = EXCLUDED.lesson_json,
    cache_version = EXCLUDED.cache_version,
    expires_at = EXCLUDED.expires_at,
    created_at = now();
END;
$$;

COMMENT ON FUNCTION upsert_generated_lesson IS 'Upsert a shared (non-personalized) generated lesson cache entry. Uses partial index ON CONFLICT with WHERE student_id IS NULL.';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
