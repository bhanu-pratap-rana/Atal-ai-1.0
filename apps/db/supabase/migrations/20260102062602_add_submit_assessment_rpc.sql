-- Migration 052: Add atomic assessment submission RPC function
-- Purpose: Fix CRITICAL Issue: Missing Transaction in Assessment Submission
-- Ensures assessment responses and session submission are atomic

-- Create or replace the submit_assessment RPC function
-- This performs assessment submission in a single atomic transaction
CREATE OR REPLACE FUNCTION submit_assessment(
  p_session_id uuid,
  p_user_id uuid,
  p_responses jsonb  -- Array of {item_id, module, is_correct, rt_ms, focus_blur_count, chosen_option}
)
RETURNS jsonb AS $$
DECLARE
  v_session_data RECORD;
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_score INTEGER;
  v_module_breakdown JSONB;
BEGIN
  -- SECURITY: Verify session belongs to user
  SELECT id, user_id, submitted_at
  INTO v_session_data
  FROM assessment_sessions
  WHERE id = p_session_id
  FOR UPDATE;  -- Acquire exclusive lock to prevent race conditions

  IF v_session_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  END IF;

  -- SECURITY: Verify ownership
  IF v_session_data.user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- IDEMPOTENCY: Check if already submitted
  IF v_session_data.submitted_at IS NOT NULL THEN
    -- Session already submitted - return existing score
    SELECT
      COUNT(*)::INTEGER,
      COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
    INTO v_total_questions, v_correct_answers
    FROM assessment_responses
    WHERE session_id = p_session_id;

    v_score := CASE
      WHEN v_total_questions > 0
      THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER
      ELSE 0
    END;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Assessment already submitted',
      'score', v_score,
      'totalQuestions', v_total_questions,
      'correctAnswers', v_correct_answers,
      'alreadySubmitted', true
    );
  END IF;

  -- ATOMIC: Insert responses and update session in single transaction
  -- Insert all responses
  INSERT INTO assessment_responses (session_id, item_id, module, is_correct, rt_ms, focus_blur_count, chosen_option)
  SELECT
    p_session_id,
    (response ->> 'itemId')::uuid,
    response ->> 'module',
    (response ->> 'isCorrect')::boolean,
    (response ->> 'rtMs')::INTEGER,
    (response ->> 'focusBlurCount')::INTEGER,
    response ->> 'chosenOption'
  FROM jsonb_array_elements(p_responses) AS response;

  -- Mark session as submitted
  UPDATE assessment_sessions
  SET submitted_at = NOW()
  WHERE id = p_session_id;

  -- Calculate score from inserted responses
  SELECT
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
  INTO v_total_questions, v_correct_answers
  FROM assessment_responses
  WHERE session_id = p_session_id;

  v_score := CASE
    WHEN v_total_questions > 0
    THEN ROUND((v_correct_answers::numeric / v_total_questions) * 100)::INTEGER
    ELSE 0
  END;

  -- Build module breakdown
  SELECT jsonb_object_agg(
    module,
    jsonb_build_object(
      'total', COUNT(*)::INTEGER,
      'correct', COUNT(CASE WHEN is_correct = true THEN 1 END)::INTEGER
    )
  )
  INTO v_module_breakdown
  FROM assessment_responses
  WHERE session_id = p_session_id
  GROUP BY module;

  -- Return success with all metadata
  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'totalQuestions', v_total_questions,
    'correctAnswers', v_correct_answers,
    'moduleBreakdown', COALESCE(v_module_breakdown, '{}'::jsonb),
    'alreadySubmitted', false
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error server-side via RAISE NOTICE
  RAISE NOTICE 'submit_assessment error: % (%)', SQLERRM, SQLSTATE;

  -- Return generic error to client
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to submit assessment. Please try again.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION submit_assessment(uuid, uuid, jsonb) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION submit_assessment(uuid, uuid, jsonb) IS
'Atomic assessment submission RPC function. Inserts responses and marks session as submitted in single transaction. Prevents partial failures and ensures data consistency. Includes idempotency check to handle retry scenarios.';;
