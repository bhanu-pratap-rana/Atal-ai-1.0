-- FIX #2: Add UPSERT function for student profile
-- Purpose: Eliminate race condition in concurrent profile saves
-- Status: CRITICAL SECURITY FIX
-- Date: 2026-01-01

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS upsert_student_profile(uuid, text, text, text, text, text, text, text, text);

-- Create atomic UPSERT RPC function
-- Uses ON CONFLICT (user_id) to handle concurrent inserts atomically
CREATE OR REPLACE FUNCTION upsert_student_profile(
  p_user_id uuid,
  p_name text,
  p_gender text,
  p_date_of_birth text,
  p_phone text,
  p_location text,
  p_medium text,
  p_board text,
  p_class text
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- ATOMIC UPSERT: Single database operation prevents race condition
  -- If another request inserts same user_id simultaneously,
  -- PostgreSQL ensures only one succeeds (first to acquire lock)
  INSERT INTO student_profiles (
    user_id,
    name,
    gender,
    date_of_birth,
    phone,
    location,
    medium,
    board,
    class,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_name,
    p_gender,
    p_date_of_birth,
    p_phone,
    p_location,
    p_medium,
    p_board,
    p_class,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    medium = EXCLUDED.medium,
    board = EXCLUDED.board,
    class = EXCLUDED.class,
    updated_at = NOW()
  RETURNING jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'name', name,
    'gender', gender
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- SECURITY: Sanitize error message to prevent schema discovery
  -- Log raw error server-side via Supabase logs, return generic error to client
  RAISE NOTICE 'upsert_student_profile error: % (%)', SQLERRM, SQLSTATE;

  -- Return generic error to client to prevent information leakage
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to save profile. Please try again.',
    'code', 'PROFILE_SAVE_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant RPC access to authenticated users
GRANT EXECUTE ON FUNCTION upsert_student_profile TO authenticated;

-- Comment documenting the function
COMMENT ON FUNCTION upsert_student_profile IS
  'Atomic UPSERT for student profiles - prevents race condition in concurrent saves. ' ||
  'Uses ON CONFLICT clause to ensure only one record per user_id exists.';
