-- Migration 053: Add atomic knowledge state update RPC function
-- Purpose: Fix MEDIUM Issue #1: Race Condition in updateAbilityEstimate()
-- Ensures knowledge state updates are atomic and concurrent-safe

-- Create or replace the update_knowledge_state RPC function
-- This performs knowledge state calculation and update in a single atomic transaction
CREATE OR REPLACE FUNCTION update_knowledge_state(
  p_student_id uuid,
  p_module_id uuid,
  p_topic_id uuid,
  p_is_correct boolean,
  p_response_time_ms integer,
  p_ai_hint_requested boolean
)
RETURNS jsonb AS $$
DECLARE
  v_current_state RECORD;
  v_current_mastery numeric := 0;
  v_new_mastery numeric;
  v_learning_rate numeric;
  v_time_bonus numeric := 0;
  v_hint_penalty numeric := 0;
  v_days_since_last integer;
  v_decay_factor numeric;
  v_confidence_level text;
  v_new_status text;
  v_new_attempts integer;
  v_new_time_spent integer;
BEGIN
  -- ATOMIC: Lock current state to prevent concurrent updates
  SELECT *
  INTO v_current_state
  FROM student_knowledge_state
  WHERE student_id = p_student_id
    AND module_id = p_module_id
    AND topic_id = p_topic_id
  FOR UPDATE;

  -- Get current mastery score (default 0 if not found)
  IF v_current_state IS NOT NULL THEN
    v_current_mastery := v_current_state.mastery_score;
    v_new_attempts := v_current_state.attempts + 1;
    v_new_time_spent := v_current_state.time_spent_seconds + ROUND(p_response_time_ms / 1000.0)::integer;
  ELSE
    v_new_attempts := 1;
    v_new_time_spent := ROUND(p_response_time_ms / 1000.0)::integer;
  END IF;

  -- Calculate learning rate based on correctness
  v_learning_rate := CASE
    WHEN p_is_correct THEN 0.15
    ELSE -0.05
  END;

  -- Adjust for response time (faster = more confident)
  IF p_response_time_ms < 10000 THEN
    v_time_bonus := 0.02;
  END IF;

  -- Penalty for using hints
  IF p_ai_hint_requested THEN
    v_hint_penalty := 0.03;
  END IF;

  -- Calculate new mastery: current + learning_rate + time_bonus - hint_penalty
  v_new_mastery := v_current_mastery + v_learning_rate + v_time_bonus - v_hint_penalty;

  -- Apply forgetting curve if last attempt was long ago
  IF v_current_state IS NOT NULL AND v_current_state.last_attempt_at IS NOT NULL THEN
    v_days_since_last := FLOOR(
      (EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM v_current_state.last_attempt_at::timestamp)) / (86400)
    )::integer;

    IF v_days_since_last > 7 THEN
      -- Decay factor based on Ebbinghaus curve: exp(-0.1 * days)
      v_decay_factor := EXP(-0.1 * v_days_since_last);
      v_new_mastery := v_new_mastery * (0.5 + 0.5 * v_decay_factor);
    END IF;
  END IF;

  -- Clamp to valid range [0, 100]
  v_new_mastery := GREATEST(0, LEAST(100, v_new_mastery));

  -- Determine confidence level from mastery
  v_confidence_level := CASE
    WHEN v_new_mastery >= 80 THEN 'high'
    WHEN v_new_mastery >= 50 THEN 'medium'
    ELSE 'low'
  END;

  -- Determine status from mastery and attempts
  v_new_status := CASE
    WHEN v_new_attempts = 0 THEN 'not_started'
    WHEN v_new_mastery >= 70 THEN 'mastered'
    ELSE 'in_progress'
  END;

  -- ATOMIC: Perform UPSERT in same transaction with lock
  INSERT INTO student_knowledge_state (
    student_id,
    module_id,
    topic_id,
    mastery_score,
    confidence_level,
    attempts,
    time_spent_seconds,
    last_attempt_at,
    status
  ) VALUES (
    p_student_id,
    p_module_id,
    p_topic_id,
    v_new_mastery,
    v_confidence_level,
    v_new_attempts,
    v_new_time_spent,
    NOW(),
    v_new_status
  )
  ON CONFLICT (student_id, module_id, topic_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    confidence_level = v_confidence_level,
    attempts = v_new_attempts,
    time_spent_seconds = v_new_time_spent,
    last_attempt_at = NOW(),
    status = v_new_status,
    updated_at = NOW();

  -- Return success with updated state
  RETURN jsonb_build_object(
    'success', true,
    'mastery_score', ROUND(v_new_mastery::numeric, 2),
    'confidence_level', v_confidence_level,
    'attempts', v_new_attempts,
    'status', v_new_status,
    'time_spent_seconds', v_new_time_spent
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error server-side via RAISE NOTICE
  RAISE NOTICE 'update_knowledge_state error: % (%)', SQLERRM, SQLSTATE;

  -- Return generic error to client
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to update knowledge state. Please try again.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_knowledge_state(uuid, uuid, uuid, boolean, integer, boolean) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION update_knowledge_state(uuid, uuid, uuid, boolean, integer, boolean) IS
'Atomic knowledge state update RPC function. Implements BKT-inspired mastery calculation with atomic locking to prevent concurrent update race conditions. Includes forgetting curve calculation and returns updated knowledge state.';
