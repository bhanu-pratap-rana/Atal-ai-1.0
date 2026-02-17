-- Migration 077: Fix nested aggregate functions in submit_assessment
-- Bug: jsonb_object_agg cannot contain nested COUNT() calls
-- Fix: Use subquery to calculate counts first, then aggregate into JSONB
-- Error: "aggregate function calls cannot be nested" (line 58)

CREATE OR REPLACE FUNCTION submit_assessment(
  p_session_id uuid,
  p_user_id uuid,
  p_responses jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_session_data RECORD;
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_score INTEGER;
  v_module_breakdown JSONB;
  v_response RECORD;
  v_knowledge_update_result JSONB;
BEGIN
  -- SECURITY: Verify session belongs to user
  SELECT id, user_id, submitted_at
  INTO v_session_data
  FROM assessment_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_session_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session_data.user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- IDEMPOTENCY: Check if already submitted
  IF v_session_data.submitted_at IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER, COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
    INTO v_total_questions, v_correct_answers
    FROM assessment_responses WHERE session_id = p_session_id;

    v_score := CASE WHEN v_total_questions > 0
      THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER ELSE 0 END;

    RETURN jsonb_build_object('success', true, 'message', 'Assessment already submitted',
      'score', v_score, 'totalQuestions', v_total_questions,
      'correctAnswers', v_correct_answers, 'alreadySubmitted', true);
  END IF;

  -- Insert responses with user_id
  INSERT INTO assessment_responses (session_id, item_id, module, is_correct, rt_ms, focus_blur_count, chosen_option, user_id)
  SELECT p_session_id, response ->> 'itemId', response ->> 'module',
    (response ->> 'isCorrect')::boolean, (response ->> 'rtMs')::INTEGER,
    (response ->> 'focusBlurCount')::INTEGER, response ->> 'chosenOption', p_user_id
  FROM jsonb_array_elements(p_responses) AS response;

  -- Mark session as submitted
  UPDATE assessment_sessions SET submitted_at = NOW() WHERE id = p_session_id;

  -- Calculate score
  SELECT COUNT(*)::INTEGER, COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
  INTO v_total_questions, v_correct_answers FROM assessment_responses WHERE session_id = p_session_id;

  v_score := CASE WHEN v_total_questions > 0
    THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER ELSE 0 END;

  -- ✅ FIXED: Build module breakdown using subquery to avoid nested aggregates
  SELECT jsonb_object_agg(module, module_stats)
  INTO v_module_breakdown
  FROM (
    SELECT 
      module,
      jsonb_build_object(
        'total', COUNT(*)::INTEGER,
        'correct', COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
      ) AS module_stats
    FROM assessment_responses
    WHERE session_id = p_session_id
    GROUP BY module
  ) module_summary;

  -- ✅ Update knowledge state for each response
  FOR v_response IN
    SELECT ar.item_id, ar.is_correct, ar.rt_ms, irt.category as topic_category
    FROM assessment_responses ar
    JOIN irt_item_bank irt ON irt.id = ar.item_id::uuid
    WHERE ar.session_id = p_session_id
  LOOP
    SELECT update_knowledge_state(p_user_id, 'adaptive_assessment'::text,
      v_response.topic_category::text, v_response.is_correct,
      COALESCE(v_response.rt_ms, 30000), false) INTO v_knowledge_update_result;

    IF v_knowledge_update_result->>'success' != 'true' THEN
      RAISE NOTICE 'Failed to update knowledge state for topic %: %',
        v_response.topic_category, v_knowledge_update_result->>'error';
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'score', v_score,
    'totalQuestions', v_total_questions, 'correctAnswers', v_correct_answers,
    'moduleBreakdown', COALESCE(v_module_breakdown, '{}'::jsonb), 'alreadySubmitted', false);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'submit_assessment error: % (%)', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object('success', false, 'error', 'Failed to submit assessment. Please try again.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
