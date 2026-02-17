-- FIX: Update pgcrypto function calls to use extensions schema
-- ISSUE: pgcrypto functions (crypt, gen_salt) are in extensions schema, not public
-- ERROR: "function public.gen_salt(unknown, integer) does not exist"
--
-- SOLUTION: Update rotate_staff_pin and verify_staff_pin to use extensions.crypt()
-- and extensions.gen_salt() instead of unqualified function calls

-- ============================================================================
-- PART 1: Ensure pgcrypto extension is enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- PART 2: Update rotate_staff_pin function with proper schema references
-- ============================================================================

CREATE OR REPLACE FUNCTION rotate_staff_pin(
  p_school_id UUID,
  p_new_pin TEXT
) RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_pin TEXT
) AS $$
DECLARE
  v_new_hash TEXT;
  v_exists BOOLEAN;
  v_current_role TEXT;
BEGIN
  -- Get the current role
  SELECT current_setting('role', true) INTO v_current_role;

  -- Validate PIN format (4-8 digits)
  IF NOT (p_new_pin ~ '^\d{4,8}$') THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Invalid PIN format: Must be 4-8 digits'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Hash the new PIN using bcrypt (FIXED: use extensions schema)
  v_new_hash := extensions.crypt(p_new_pin, extensions.gen_salt('bf', 10));

  -- Check if PIN already exists for school
  SELECT EXISTS(
    SELECT 1 FROM public.school_staff_credentials
    WHERE school_staff_credentials.school_id = p_school_id AND deleted_at IS NULL
  ) INTO v_exists;

  IF v_exists THEN
    -- Update existing PIN
    UPDATE public.school_staff_credentials
    SET
      pin_hash = v_new_hash,
      rotated_at = NOW(),
      updated_at = NOW()
    WHERE school_staff_credentials.school_id = p_school_id AND deleted_at IS NULL;
  ELSE
    -- Insert new PIN
    INSERT INTO public.school_staff_credentials (
      school_id,
      pin_hash,
      rotated_at,
      created_at,
      updated_at
    ) VALUES (
      p_school_id,
      v_new_hash,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Return success with the PIN
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    NULL::TEXT,
    p_new_pin::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Update verify_staff_pin function with proper schema references
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_staff_pin(
  p_school_id UUID,
  p_pin TEXT
) RETURNS TABLE (
  is_valid BOOLEAN,
  pin_id UUID,
  school_id UUID
) AS $$
DECLARE
  v_pin_hash TEXT;
  v_pin_id UUID;
  v_school_id UUID;
  v_current_role TEXT;
BEGIN
  -- Get the current role
  SELECT current_setting('role', true) INTO v_current_role;

  -- Get the PIN hash for this school
  SELECT
    id,
    school_staff_credentials.school_id,
    pin_hash
  INTO
    v_pin_id,
    v_school_id,
    v_pin_hash
  FROM public.school_staff_credentials
  WHERE school_staff_credentials.school_id = p_school_id
  AND deleted_at IS NULL;

  -- If no PIN found, return false (not valid)
  IF v_pin_hash IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Compare PIN using crypt (FIXED: use extensions schema)
  IF extensions.crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    RETURN QUERY SELECT TRUE, v_pin_id, v_school_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Grant proper permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION verify_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_pin(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO service_role;

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- ISSUE: PIN rotation and verification were failing with error:
--   "function public.gen_salt(unknown, integer) does not exist"
--
-- ROOT CAUSE:
--   - pgcrypto extension installs functions in 'extensions' schema
--   - Previous migration 020 used unqualified function calls (crypt, gen_salt)
--   - PostgreSQL couldn't find functions in search_path
--
-- FIX:
--   - Explicitly reference extensions.crypt() and extensions.gen_salt()
--   - This ensures functions are found regardless of search_path
--
-- VERIFICATION:
--   1. Test PIN rotation: SELECT * FROM rotate_staff_pin('<school_id>', '1234');
--   2. Test PIN verification: SELECT * FROM verify_staff_pin('<school_id>', '1234');
--   3. Verify wrong PIN returns false: SELECT * FROM verify_staff_pin('<school_id>', '9999');
--
-- TESTED:
--   ✓ PIN rotation works (success=true)
--   ✓ Valid PIN verification returns is_valid=true
--   ✓ Invalid PIN verification returns is_valid=false
