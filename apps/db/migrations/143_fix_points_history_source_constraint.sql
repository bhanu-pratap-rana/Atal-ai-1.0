-- =====================================================
-- Migration 143: Fix points_history source constraint
-- =====================================================
--
-- BUG FIX: The CHECK constraint on points_history.source doesn't match
-- the values used by the gamification service code.
--
-- PROBLEM:
-- Database allows: 'assessment_complete', 'badge_earned', 'streak_bonus',
--                  'lesson_complete', 'voice_practice', 'daily_login'
--
-- Code uses: 'lesson', 'question', 'assessment', 'voice', 'high_score_bonus'
--
-- IMPACT: INSERT statements fail silently, points are lost!
--
-- SOLUTION: Drop the old constraint and add a new one with all valid sources
--
-- =====================================================

-- Step 1: Find and drop the existing CHECK constraint
-- The constraint name is auto-generated, so we need to find it dynamically
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the check constraint on the source column
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'points_history'::regclass
    AND c.contype = 'c'
    AND a.attname = 'source'
    AND a.attrelid = 'points_history'::regclass;

  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE points_history DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No source constraint found to drop';
  END IF;
END $$;

-- Step 2: Add new CHECK constraint with all valid sources
ALTER TABLE points_history
ADD CONSTRAINT points_history_source_check CHECK (source IN (
  -- Original values (migration 042)
  'assessment_complete',
  'badge_earned',
  'streak_bonus',
  'lesson_complete',
  'voice_practice',
  'daily_login',
  -- Values used by gamification-service.ts triggerActivityCheck()
  'lesson',
  'question',
  'assessment',
  'voice',
  -- Values used by gamification.ts awardLessonCompletionPoints()
  'high_score_bonus',
  -- Additional sources for future use
  'bonus',
  'referral',
  'achievement'
));

-- Step 3: Add comment explaining the constraint
COMMENT ON CONSTRAINT points_history_source_check ON points_history IS
'Valid point sources: original gamification sources + code-used sources. Updated in migration 143.';

-- =====================================================
-- Verification: List all valid sources
-- =====================================================
-- SELECT DISTINCT source FROM points_history ORDER BY source;
--
-- Expected after fix:
-- - lesson, question, assessment, voice (from triggerActivityCheck)
-- - high_score_bonus (from awardLessonCompletionPoints)
-- - badge_earned (from batch_check_and_award_badges)
-- - streak_bonus, daily_login (future use)
-- =====================================================
