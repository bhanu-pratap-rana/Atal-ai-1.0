-- =====================================================
-- Migration 131: Fix Badge Criteria - Add Missing Types
-- =====================================================
--
-- Problem: The batch_check_and_award_badges function only handles
-- 5 criteria types, but 10 badges exist with different criteria.
-- This means badges like Curious Mind, Voice Learner, Night Owl,
-- Early Bird can NEVER be earned.
--
-- Also fixes: Original function references non-existent student_progress table.
-- Should use student_knowledge_state instead.
--
-- Solution: Add missing CASE branches for all criteria types.
-- Fix table references to use correct schema.
--
-- DEPLOYMENT NOTE:
-- If you see "column reference badge_id is ambiguous" error,
-- this migration may not have been deployed. Run:
--   supabase db push
-- Or apply this migration manually in the Supabase SQL editor.
--
-- =====================================================

CREATE OR REPLACE FUNCTION batch_check_and_award_badges(
  p_student_id UUID
)
RETURNS TABLE (
  badge_id TEXT,
  badge_name_en TEXT,
  badge_name_hi TEXT,
  badge_name_as TEXT,
  points_awarded INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_badge RECORD;
  v_earned BOOLEAN;
  v_count INTEGER;
  v_threshold INTEGER;
  v_after_hour INTEGER;
  v_before_hour INTEGER;
  v_lessons_required INTEGER;
BEGIN
  -- Get all unearned badges
  FOR v_badge IN
    SELECT b.*
    FROM badges b
    LEFT JOIN student_badges sb ON b.id = sb.badge_id AND sb.student_id = p_student_id
    WHERE sb.badge_id IS NULL
  LOOP
    v_earned := FALSE;
    v_threshold := COALESCE((v_badge.unlock_criteria->>'threshold')::INTEGER, 1);

    -- Check criteria based on type
    CASE v_badge.unlock_criteria->>'type'
      -- Existing criteria
      WHEN 'lessons_completed' THEN
        -- Count lessons with mastery_score >= 70 (matches gamification-service.ts)
        SELECT COUNT(*) INTO v_count
        FROM student_knowledge_state
        WHERE student_id = p_student_id AND mastery_score >= 70;
        v_earned := v_count >= v_threshold;

      WHEN 'modules_mastered' THEN
        SELECT COUNT(DISTINCT module_id) INTO v_count
        FROM student_knowledge_state
        WHERE student_id = p_student_id AND status = 'mastered';
        v_earned := v_count >= v_threshold;

      WHEN 'assessments_passed' THEN
        SELECT COUNT(*) INTO v_count
        FROM assessment_sessions
        WHERE user_id = p_student_id AND submitted_at IS NOT NULL;
        v_earned := v_count >= v_threshold;

      WHEN 'high_score' THEN
        -- Check for high score on summative assessments (matches gamification-service.ts)
        SELECT COUNT(*) INTO v_count
        FROM summative_results
        WHERE student_id = p_student_id
          AND total_score >= v_threshold;
        v_earned := v_count >= 1;

      WHEN 'weekly_streak' THEN
        -- Check if student has activity on specified days in a week (matches gamification-service.ts)
        -- Count distinct dates where mastery_score >= 70 in last 7 days
        SELECT COUNT(DISTINCT DATE(last_attempt_at)) INTO v_count
        FROM student_knowledge_state
        WHERE student_id = p_student_id
          AND last_attempt_at >= NOW() - INTERVAL '7 days'
          AND mastery_score >= 70;
        v_earned := v_count >= v_threshold;

      -- NEW: questions_asked (Curious Mind badge)
      WHEN 'questions_asked' THEN
        SELECT COUNT(*) INTO v_count
        FROM ai_tutor_interactions
        WHERE student_id = p_student_id
          AND message_role = 'user';
        v_earned := v_count >= v_threshold;

      -- NEW: voice_usage (Voice Learner badge)
      WHEN 'voice_usage' THEN
        SELECT COUNT(*) INTO v_count
        FROM ai_tutor_interactions
        WHERE student_id = p_student_id
          AND input_mode = 'voice';
        v_earned := v_count >= v_threshold;

      -- NEW: perfect_score (Perfect Score badge)
      WHEN 'perfect_score' THEN
        SELECT COUNT(*) INTO v_count
        FROM summative_results
        WHERE student_id = p_student_id
          AND total_score = 100;
        v_earned := v_count >= 1;

      -- NEW: time_based (Night Owl and Early Bird badges)
      WHEN 'time_based' THEN
        v_after_hour := (v_badge.unlock_criteria->>'after_hour')::INTEGER;
        v_before_hour := (v_badge.unlock_criteria->>'before_hour')::INTEGER;
        v_lessons_required := COALESCE((v_badge.unlock_criteria->>'lessons')::INTEGER, 1);

        IF v_after_hour IS NOT NULL THEN
          -- Night Owl: activity after specified hour (e.g., 8 PM = 20)
          SELECT COUNT(*) INTO v_count
          FROM ai_tutor_interactions
          WHERE student_id = p_student_id
            AND EXTRACT(HOUR FROM created_at) >= v_after_hour;
          v_earned := v_count >= v_lessons_required;
        ELSIF v_before_hour IS NOT NULL THEN
          -- Early Bird: activity before specified hour (e.g., 7 AM = 7)
          SELECT COUNT(*) INTO v_count
          FROM ai_tutor_interactions
          WHERE student_id = p_student_id
            AND EXTRACT(HOUR FROM created_at) < v_before_hour;
          v_earned := v_count >= v_lessons_required;
        ELSE
          v_earned := FALSE;
        END IF;

      ELSE
        -- Unknown criteria type, skip
        CONTINUE;
    END CASE;

    -- Award badge if earned
    IF v_earned THEN
      -- Insert badge (idempotent with ON CONFLICT)
      INSERT INTO student_badges (student_id, badge_id)
      VALUES (p_student_id, v_badge.id)
      ON CONFLICT (student_id, badge_id) DO NOTHING;

      -- Award bonus points (uses 'source' column per points_history schema)
      INSERT INTO points_history (student_id, points, source, description)
      VALUES (
        p_student_id,
        v_badge.points_value,
        'badge_earned',
        'Earned badge: ' || v_badge.name_en
      );

      -- Return earned badge info
      -- FIX: Explicit type casts to avoid any potential column ambiguity
      RETURN QUERY SELECT
        v_badge.id::TEXT AS badge_id,
        v_badge.name_en::TEXT AS badge_name_en,
        v_badge.name_hi::TEXT AS badge_name_hi,
        v_badge.name_as::TEXT AS badge_name_as,
        v_badge.points_value::INTEGER AS points_awarded;
    END IF;
  END LOOP;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION batch_check_and_award_badges(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION batch_check_and_award_badges IS
'Batch checks and awards all eligible badges for a student. '
'Supports all badge criteria types: lessons_completed, modules_mastered, '
'assessments_passed, high_score, weekly_streak, questions_asked, '
'voice_usage, perfect_score, time_based. '
'FIXED: Uses student_knowledge_state (not student_progress) for lesson tracking.';
