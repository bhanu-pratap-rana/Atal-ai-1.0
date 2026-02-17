-- Migration 162: RPC functions for pre/post assessment comparison
-- Part of Pre/Post Assessment feature (specs/pre-post-assessment/design.md)

-- 1. Get pre vs post assessment comparison for a student
CREATE OR REPLACE FUNCTION get_assessment_comparison(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  pre_result JSONB;
  post_result JSONB;
  pre_session_id UUID;
  post_session_id UUID;
BEGIN
  -- Get latest pre-assessment session
  SELECT s.id INTO pre_session_id
  FROM assessment_sessions s
  WHERE s.user_id = p_user_id
    AND s.session_type = 'pre'
    AND s.submitted_at IS NOT NULL
  ORDER BY s.submitted_at DESC
  LIMIT 1;

  -- Get latest post-assessment session
  SELECT s.id INTO post_session_id
  FROM assessment_sessions s
  WHERE s.user_id = p_user_id
    AND s.session_type = 'post'
    AND s.submitted_at IS NOT NULL
  ORDER BY s.submitted_at DESC
  LIMIT 1;

  -- Build pre-assessment result
  IF pre_session_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'session_id', s.id,
      'submitted_at', s.submitted_at,
      'total_questions', COUNT(r.id),
      'correct_answers', COUNT(r.id) FILTER (WHERE r.is_correct),
      'score', CASE WHEN COUNT(r.id) > 0
        THEN ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.is_correct) / COUNT(r.id), 1)
        ELSE 0 END,
      'modules', (
        SELECT COALESCE(jsonb_object_agg(
          sub.module,
          jsonb_build_object(
            'total', sub.total,
            'correct', sub.correct,
            'score', CASE WHEN sub.total > 0
              THEN ROUND(100.0 * sub.correct / sub.total, 1)
              ELSE 0 END
          )
        ), '{}'::jsonb)
        FROM (
          SELECT r2.module,
                 COUNT(*) as total,
                 COUNT(*) FILTER (WHERE r2.is_correct) as correct
          FROM assessment_responses r2
          WHERE r2.session_id = pre_session_id
          GROUP BY r2.module
        ) sub
      )
    ) INTO pre_result
    FROM assessment_sessions s
    JOIN assessment_responses r ON r.session_id = s.id
    WHERE s.id = pre_session_id
    GROUP BY s.id, s.submitted_at;
  END IF;

  -- Build post-assessment result
  IF post_session_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'session_id', s.id,
      'submitted_at', s.submitted_at,
      'total_questions', COUNT(r.id),
      'correct_answers', COUNT(r.id) FILTER (WHERE r.is_correct),
      'score', CASE WHEN COUNT(r.id) > 0
        THEN ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.is_correct) / COUNT(r.id), 1)
        ELSE 0 END,
      'modules', (
        SELECT COALESCE(jsonb_object_agg(
          sub.module,
          jsonb_build_object(
            'total', sub.total,
            'correct', sub.correct,
            'score', CASE WHEN sub.total > 0
              THEN ROUND(100.0 * sub.correct / sub.total, 1)
              ELSE 0 END
          )
        ), '{}'::jsonb)
        FROM (
          SELECT r2.module,
                 COUNT(*) as total,
                 COUNT(*) FILTER (WHERE r2.is_correct) as correct
          FROM assessment_responses r2
          WHERE r2.session_id = post_session_id
          GROUP BY r2.module
        ) sub
      )
    ) INTO post_result
    FROM assessment_sessions s
    JOIN assessment_responses r ON r.session_id = s.id
    WHERE s.id = post_session_id
    GROUP BY s.id, s.submitted_at;
  END IF;

  RETURN jsonb_build_object(
    'pre', COALESCE(pre_result, 'null'::jsonb),
    'post', COALESCE(post_result, 'null'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Check and mark curriculum completion
-- A student completes the curriculum when all 5 categories reach mastery_score >= 70
CREATE OR REPLACE FUNCTION check_curriculum_completion(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  mastered_count INT;
  total_categories INT := 5;
  is_completed BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO mastered_count
  FROM student_knowledge_state
  WHERE student_id = p_student_id
    AND topic_id IN (
      'contextual_application',
      'digital_content_creation',
      'digital_device_familiarity',
      'internet_web_awareness',
      'problem_solving_aptitude'
    )
    AND mastery_score >= 70;

  is_completed := mastered_count >= total_categories;

  -- If just completed, update the profile
  IF is_completed THEN
    UPDATE student_profiles
    SET curriculum_completed = true,
        curriculum_completed_at = COALESCE(curriculum_completed_at, now())
    WHERE user_id = p_student_id
      AND curriculum_completed = false;
  END IF;

  RETURN jsonb_build_object(
    'completed', is_completed,
    'mastered_categories', mastered_count,
    'total_categories', total_categories
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Check if student has taken a specific assessment type
CREATE OR REPLACE FUNCTION has_assessment_type(p_user_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assessment_sessions
    WHERE user_id = p_user_id
      AND session_type = p_type
      AND submitted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
