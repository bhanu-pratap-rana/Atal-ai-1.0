-- Migration 078: Fix function search path security warnings
-- Purpose: Set explicit search_path on SECURITY DEFINER functions to prevent search_path hijacking
-- Impact: Fixes 2 security advisor warnings (submit_assessment, update_knowledge_state)
-- Security: Prevents malicious users from creating tables in schemas earlier in search_path

-- =====================================================
-- Fix submit_assessment search path
-- =====================================================
CREATE OR REPLACE FUNCTION submit_assessment(
  p_session_id uuid,
  p_user_id uuid,
  p_responses jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_session_data RECORD;
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_score INTEGER;
  v_module_breakdown JSONB;
  v_response RECORD;
  v_knowledge_update_result JSONB;
BEGIN
  SELECT id, user_id, submitted_at INTO v_session_data
  FROM assessment_sessions WHERE id = p_session_id FOR UPDATE;

  IF v_session_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session_data.user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_session_data.submitted_at IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER, COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
    INTO v_total_questions, v_correct_answers FROM assessment_responses WHERE session_id = p_session_id;
    v_score := CASE WHEN v_total_questions > 0 THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER ELSE 0 END;
    RETURN jsonb_build_object('success', true, 'message', 'Assessment already submitted',
      'score', v_score, 'totalQuestions', v_total_questions, 'correctAnswers', v_correct_answers, 'alreadySubmitted', true);
  END IF;

  INSERT INTO assessment_responses (session_id, item_id, module, is_correct, rt_ms, focus_blur_count, chosen_option, user_id)
  SELECT p_session_id, response ->> 'itemId', response ->> 'module',
    (response ->> 'isCorrect')::boolean, (response ->> 'rtMs')::INTEGER,
    (response ->> 'focusBlurCount')::INTEGER, response ->> 'chosenOption', p_user_id
  FROM jsonb_array_elements(p_responses) AS response;

  UPDATE assessment_sessions SET submitted_at = NOW() WHERE id = p_session_id;
  SELECT COUNT(*)::INTEGER, COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
  INTO v_total_questions, v_correct_answers FROM assessment_responses WHERE session_id = p_session_id;
  v_score := CASE WHEN v_total_questions > 0 THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER ELSE 0 END;

  SELECT jsonb_object_agg(module, module_stats) INTO v_module_breakdown
  FROM (
    SELECT module, jsonb_build_object('total', COUNT(*)::INTEGER, 'correct', COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER) AS module_stats
    FROM assessment_responses WHERE session_id = p_session_id GROUP BY module
  ) module_summary;

  FOR v_response IN
    SELECT ar.item_id, ar.is_correct, ar.rt_ms, irt.category as topic_category
    FROM assessment_responses ar JOIN irt_item_bank irt ON irt.id = ar.item_id::uuid WHERE ar.session_id = p_session_id
  LOOP
    SELECT update_knowledge_state(p_user_id, 'adaptive_assessment'::text, v_response.topic_category::text, 
      v_response.is_correct, COALESCE(v_response.rt_ms, 30000), false) INTO v_knowledge_update_result;
    IF v_knowledge_update_result->>'success' != 'true' THEN
      RAISE NOTICE 'Failed to update knowledge state for topic %: %', v_response.topic_category, v_knowledge_update_result->>'error';
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'score', v_score, 'totalQuestions', v_total_questions, 
    'correctAnswers', v_correct_answers, 'moduleBreakdown', COALESCE(v_module_breakdown, '{}'::jsonb), 'alreadySubmitted', false);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'submit_assessment error: % (%)', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object('success', false, 'error', 'Failed to submit assessment. Please try again.');
END;
$$;

-- =====================================================
-- Fix update_knowledge_state search path
-- =====================================================
CREATE OR REPLACE FUNCTION update_knowledge_state(
  p_student_id uuid, p_module_id text, p_topic_id text, p_is_correct boolean, p_response_time_ms integer, p_ai_hint_requested boolean
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_current_state RECORD; v_current_mastery numeric := 0; v_new_mastery numeric; v_learning_rate numeric;
  v_confidence_level text; v_new_status text; v_time_increment integer;
BEGIN
  SELECT mastery_score, attempts, time_spent_seconds, confidence_level, status INTO v_current_state
  FROM student_knowledge_state WHERE student_id = p_student_id AND module_id = p_module_id AND topic_id = p_topic_id FOR UPDATE;

  IF v_current_state IS NULL THEN v_current_mastery := 0; ELSE v_current_mastery := v_current_state.mastery_score; END IF;

  v_learning_rate := CASE WHEN COALESCE(v_current_state.attempts, 0) < 3 THEN 0.3 
    WHEN COALESCE(v_current_state.attempts, 0) < 10 THEN 0.2 ELSE 0.1 END;
  IF p_ai_hint_requested THEN v_learning_rate := v_learning_rate * 0.7; END IF;

  IF p_is_correct THEN v_new_mastery := v_current_mastery + (1 - v_current_mastery) * v_learning_rate;
  ELSE v_new_mastery := v_current_mastery * (1 - v_learning_rate * 0.5); END IF;

  v_new_mastery := GREATEST(0, LEAST(1, v_new_mastery));
  v_confidence_level := CASE WHEN v_new_mastery >= 0.7 THEN 'high' WHEN v_new_mastery >= 0.4 THEN 'medium' ELSE 'low' END;
  v_new_status := CASE WHEN v_new_mastery >= 0.85 THEN 'mastered' WHEN v_new_mastery >= 0.7 THEN 'completed' 
    WHEN v_new_mastery > 0 THEN 'in_progress' ELSE 'not_started' END;
  v_time_increment := GREATEST(1, LEAST(300, p_response_time_ms / 1000));

  INSERT INTO student_knowledge_state (student_id, module_id, topic_id, mastery_score, confidence_level, attempts, 
    time_spent_seconds, last_attempt_at, status, created_at, updated_at)
  VALUES (p_student_id, p_module_id, p_topic_id, v_new_mastery, v_confidence_level, 1, v_time_increment, NOW(), v_new_status, NOW(), NOW())
  ON CONFLICT (student_id, module_id, topic_id) DO UPDATE SET
    mastery_score = v_new_mastery, confidence_level = v_confidence_level, attempts = student_knowledge_state.attempts + 1,
    time_spent_seconds = student_knowledge_state.time_spent_seconds + v_time_increment,
    last_attempt_at = NOW(), status = v_new_status, updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'mastery_score', v_new_mastery, 'confidence_level', v_confidence_level,
    'attempts', COALESCE(v_current_state.attempts, 0) + 1, 'status', v_new_status,
    'time_spent_seconds', COALESCE(v_current_state.time_spent_seconds, 0) + v_time_increment);

EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;;
