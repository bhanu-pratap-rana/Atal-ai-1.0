-- =====================================================
-- Migration 132: Fix First Steps Badge Criteria
-- =====================================================
--
-- Problem: The `first_steps` badge uses `first_lesson` criteria type,
-- which is not handled by batch_check_and_award_badges function.
--
-- Solution: Change criteria to use `lessons_completed` with threshold=1,
-- which the function already supports.
--
-- =====================================================

-- Update first_steps badge to use lessons_completed criteria
UPDATE badges
SET unlock_criteria = jsonb_build_object(
  'type', 'lessons_completed',
  'threshold', 1
)
WHERE id = 'first_steps'
  AND unlock_criteria->>'type' = 'first_lesson';

-- Verify the update
DO $$
DECLARE
  v_criteria_type TEXT;
BEGIN
  SELECT unlock_criteria->>'type' INTO v_criteria_type
  FROM badges
  WHERE id = 'first_steps';

  IF v_criteria_type = 'lessons_completed' THEN
    RAISE NOTICE 'SUCCESS: first_steps badge criteria updated to lessons_completed';
  ELSE
    RAISE WARNING 'UNEXPECTED: first_steps badge criteria is: %', v_criteria_type;
  END IF;
END $$;
