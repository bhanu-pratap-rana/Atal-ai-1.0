-- Fix badge criteria type names to match the function implementation

-- Fix Voice Learner: voice_interactions -> voice_usage
UPDATE badges
SET unlock_criteria = jsonb_set(
  unlock_criteria,
  '{type}',
  '"voice_usage"'
)
WHERE id = 'voice_learner' AND unlock_criteria->>'type' = 'voice_interactions';

-- Fix Night Owl: night_activity -> time_based with after_hour
UPDATE badges
SET unlock_criteria = jsonb_set(
  jsonb_set(
    unlock_criteria,
    '{type}',
    '"time_based"'
  ),
  '{after_hour}',
  '20'
)
WHERE id = 'night_owl' AND unlock_criteria->>'type' = 'night_activity';

-- Fix Early Bird: early_activity -> time_based with before_hour
UPDATE badges
SET unlock_criteria = jsonb_set(
  jsonb_set(
    unlock_criteria,
    '{type}',
    '"time_based"'
  ),
  '{before_hour}',
  '7'
)
WHERE id = 'early_bird' AND unlock_criteria->>'type' = 'early_activity';

-- Verify the updates
SELECT 
  id,
  name_en,
  unlock_criteria->>'type' as criteria_type,
  unlock_criteria->>'after_hour' as after_hour,
  unlock_criteria->>'before_hour' as before_hour,
  unlock_criteria->>'threshold' as threshold
FROM badges
WHERE id IN ('voice_learner', 'night_owl', 'early_bird')
ORDER BY name_en;;
