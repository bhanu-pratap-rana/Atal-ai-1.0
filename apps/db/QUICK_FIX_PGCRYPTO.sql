-- QUICK FIX: Run this ENTIRE SCRIPT in Supabase SQL Editor
-- This fixes the "function gen_salt(unknown, integer) does not exist" error

-- ============================================
-- Step 1: Enable pgcrypto extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Step 2: Verify pgcrypto works
-- ============================================
SELECT gen_salt('bf', 10) AS test_salt;
-- Should return something like: $2a$10$...

-- ============================================
-- Step 3: DROP the existing function
-- ============================================
DROP FUNCTION IF EXISTS rotate_staff_pin(UUID, TEXT);

-- ============================================
-- Step 4: Recreate rotate_staff_pin function
-- NOTE: Uses column name "pin_hash" (not "staff_pin_hash")
-- ============================================
CREATE OR REPLACE FUNCTION rotate_staff_pin(
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

  -- Hash the new PIN using bcrypt (requires pgcrypto)
  v_new_hash := crypt(p_new_pin, gen_salt('bf', 10));

  -- Check if PIN already exists for school
  SELECT EXISTS(
    SELECT 1 FROM school_staff_credentials
    WHERE school_id = p_school_id
      AND deleted_at IS NULL
  ) INTO v_pin_exists;

  IF v_pin_exists THEN
    -- Update existing PIN
    UPDATE school_staff_credentials
    SET
      pin_hash = v_new_hash,
      rotated_at = NOW(),
      updated_at = NOW()
    WHERE school_id = p_school_id
      AND deleted_at IS NULL;

    RETURN QUERY SELECT true, 'PIN rotated successfully'::TEXT;
  ELSE
    -- Insert new PIN record
    INSERT INTO school_staff_credentials (
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
-- Step 5: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO service_role;

-- ============================================
-- Step 6: Verify the function was created
-- ============================================
SELECT
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'rotate_staff_pin';

-- Done! Try generating a PIN in the admin panel.
