-- Migration 155: Fix student_knowledge_state status values
--
-- This migration:
-- 1. Converts legacy "completed" status to "mastered"
-- 2. Adds CHECK constraint to prevent invalid status values
-- 3. Creates atomic progress update function to prevent race conditions
--
-- ROOT CAUSE FIX: The codebase was writing "completed" but reading "mastered"
-- This migration permanently fixes the data and prevents future inconsistencies

-- ============================================================================
-- STEP 1: Update all "completed" records to "mastered"
-- ============================================================================

-- First, count how many records need updating (for logging)
DO $$
DECLARE
  completed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO completed_count
  FROM public.student_knowledge_state
  WHERE status = 'completed';

  RAISE NOTICE 'Migration 151: Found % records with status="completed" to migrate', completed_count;
END $$;

-- Update all "completed" records to "mastered"
UPDATE public.student_knowledge_state
SET status = 'mastered'
WHERE status = 'completed';

-- Log completion
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migration 151: Updated % records from "completed" to "mastered"', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Add CHECK constraint to prevent invalid status values
-- ============================================================================

-- Drop existing constraint if any (idempotent)
ALTER TABLE public.student_knowledge_state
DROP CONSTRAINT IF EXISTS student_knowledge_state_valid_status;

-- Add constraint to enforce valid status values
ALTER TABLE public.student_knowledge_state
ADD CONSTRAINT student_knowledge_state_valid_status
CHECK (status IS NULL OR status IN ('not_started', 'in_progress', 'mastered'));

-- ============================================================================
-- STEP 3: Create atomic progress update function
-- This prevents race conditions when concurrent requests update the same topic
-- ============================================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.update_progress_atomic(UUID, TEXT, TEXT, INTEGER);

-- Create atomic progress update function
CREATE OR REPLACE FUNCTION public.update_progress_atomic(
  p_student_id UUID,
  p_module_id TEXT,
  p_topic_id TEXT,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_new_status TEXT;
  v_new_score INTEGER;
  v_attempts INTEGER;
  v_confidence TEXT;
BEGIN
  -- Calculate status based on score threshold (70 = passing)
  v_new_status := CASE WHEN p_score >= 70 THEN 'mastered' ELSE 'in_progress' END;

  -- Calculate confidence level
  v_confidence := CASE
    WHEN p_score >= 90 THEN 'high'
    WHEN p_score >= 70 THEN 'medium'
    ELSE 'low'
  END;

  -- Atomic INSERT with ON CONFLICT UPDATE
  -- This prevents race conditions by using database-level atomicity
  INSERT INTO student_knowledge_state (
    student_id,
    module_id,
    topic_id,
    mastery_score,
    status,
    confidence_level,
    attempts,
    last_attempt_at,
    created_at,
    updated_at
  )
  VALUES (
    p_student_id,
    p_module_id,
    p_topic_id,
    p_score,
    v_new_status,
    v_confidence,
    1,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (student_id, module_id, topic_id) DO UPDATE SET
    -- Keep the HIGHEST score (don't allow regression)
    mastery_score = GREATEST(student_knowledge_state.mastery_score, EXCLUDED.mastery_score),
    -- Update status based on the highest score
    status = CASE
      WHEN GREATEST(student_knowledge_state.mastery_score, EXCLUDED.mastery_score) >= 70
      THEN 'mastered'
      ELSE 'in_progress'
    END,
    -- Update confidence based on the highest score
    confidence_level = CASE
      WHEN GREATEST(student_knowledge_state.mastery_score, EXCLUDED.mastery_score) >= 90 THEN 'high'
      WHEN GREATEST(student_knowledge_state.mastery_score, EXCLUDED.mastery_score) >= 70 THEN 'medium'
      ELSE 'low'
    END,
    -- Increment attempts
    attempts = student_knowledge_state.attempts + 1,
    -- Update timestamp
    last_attempt_at = NOW(),
    updated_at = NOW()
  RETURNING
    mastery_score,
    status,
    confidence_level,
    attempts
  INTO v_new_score, v_new_status, v_confidence, v_attempts;

  -- Return result as JSONB
  v_result := jsonb_build_object(
    'success', true,
    'mastery_score', v_new_score,
    'status', v_new_status,
    'confidence_level', v_confidence,
    'attempts', v_attempts
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_progress_atomic(UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- STEP 4: Add index for performance on status queries
-- ============================================================================

-- Create index if not exists for status-based queries
CREATE INDEX IF NOT EXISTS idx_student_knowledge_state_status
ON public.student_knowledge_state(student_id, status);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify no "completed" records remain
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.student_knowledge_state
  WHERE status = 'completed';

  IF remaining_count > 0 THEN
    RAISE EXCEPTION 'Migration 151 FAILED: % records still have status="completed"', remaining_count;
  ELSE
    RAISE NOTICE 'Migration 151 SUCCESS: All records migrated, constraint added, atomic function created';
  END IF;
END $$;
