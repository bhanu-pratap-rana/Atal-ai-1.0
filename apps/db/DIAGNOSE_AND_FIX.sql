-- COMPLETE DIAGNOSE AND FIX: Run this entire script in Supabase SQL Editor
-- This will completely fix the gen_salt issue

-- ============================================
-- STEP 1: Check which schema pgcrypto is in
-- ============================================
SELECT
  e.extname,
  e.extversion,
  n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pgcrypto';

-- ============================================
-- STEP 2: Check all schemas for gen_salt function
-- ============================================
SELECT
  n.nspname as schema_name,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'gen_salt';

-- ============================================
-- STEP 3: Drop pgcrypto and reinstall in PUBLIC schema
-- ============================================
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Install pgcrypto in the public schema explicitly
CREATE EXTENSION pgcrypto WITH SCHEMA public;

-- ============================================
-- STEP 4: Verify pgcrypto is now in public schema
-- ============================================
SELECT
  e.extname,
  n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pgcrypto';

-- ============================================
-- STEP 5: Test gen_salt with explicit schema
-- ============================================
SELECT public.gen_salt('bf', 10) AS test_salt_explicit;
SELECT gen_salt('bf', 10) AS test_salt_implicit;

-- ============================================
-- STEP 6: Drop ALL versions of rotate_staff_pin
-- ============================================
DROP FUNCTION IF EXISTS rotate_staff_pin(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.rotate_staff_pin(UUID, TEXT) CASCADE;

-- ============================================
-- STEP 7: Create function with EXPLICIT schema references
-- ============================================
CREATE FUNCTION public.rotate_staff_pin(
  p_school_id UUID,
  p_new_pin TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_hash TEXT;
  v_pin_exists BOOLEAN;
BEGIN
  -- Validate inputs
  IF p_school_id IS NULL THEN
    RETURN QUERY SELECT false, 'School ID is required'::TEXT;
    RETURN;
  END IF;

  IF p_new_pin IS NULL OR LENGTH(p_new_pin) < 4 THEN
    RETURN QUERY SELECT false, 'PIN must be at least 4 digits'::TEXT;
    RETURN;
  END IF;

  -- Hash the new PIN using bcrypt - use EXPLICIT public schema reference
  v_new_hash := public.crypt(p_new_pin, public.gen_salt('bf', 10));

  -- Check if PIN already exists for school
  SELECT EXISTS(
    SELECT 1 FROM public.school_staff_credentials
    WHERE school_id = p_school_id
      AND deleted_at IS NULL
  ) INTO v_pin_exists;

  IF v_pin_exists THEN
    -- Update existing PIN
    UPDATE public.school_staff_credentials
    SET
      pin_hash = v_new_hash,
      rotated_at = NOW(),
      updated_at = NOW()
    WHERE school_id = p_school_id
      AND deleted_at IS NULL;

    RETURN QUERY SELECT true, 'PIN rotated successfully'::TEXT;
  ELSE
    -- Insert new PIN record
    INSERT INTO public.school_staff_credentials (
      school_id,
      pin_hash,
      created_at,
      updated_at
    ) VALUES (
      p_school_id,
      v_new_hash,
      NOW(),
      NOW()
    );

    RETURN QUERY SELECT true, 'PIN created successfully'::TEXT;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::TEXT;
END;
$$;

-- ============================================
-- STEP 8: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.rotate_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_staff_pin(UUID, TEXT) TO service_role;

-- ============================================
-- STEP 9: Test the function directly with a real school
-- ============================================
SELECT id, school_name FROM schools LIMIT 1;

-- Copy the school ID from above and run:
-- SELECT * FROM public.rotate_staff_pin('paste-school-id-here', '1234');

-- ============================================
-- STEP 10: Verify the function exists in public schema
-- ============================================
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'rotate_staff_pin';

-- ============================================
-- STEP 11: CRITICAL TEST - Test directly
-- ============================================
DO $$
DECLARE
  v_school_id UUID;
  v_result RECORD;
BEGIN
  -- Get first school
  SELECT id INTO v_school_id FROM schools LIMIT 1;

  -- Test the function
  SELECT * INTO v_result FROM public.rotate_staff_pin(v_school_id, '9999');

  RAISE NOTICE 'Test result: success=%, message=%', v_result.success, v_result.error_message;
END $$;

-- After running this, check NOTICES tab for result
-- Then try the admin panel again
