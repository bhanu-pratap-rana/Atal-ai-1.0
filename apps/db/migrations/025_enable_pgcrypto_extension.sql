-- Migration: 025_enable_pgcrypto_extension.sql
-- Purpose: Enable pgcrypto extension for bcrypt password hashing functions
-- Required for: gen_salt() and crypt() functions used in PIN hashing

-- Enable pgcrypto extension if not already enabled
-- This extension provides cryptographic functions including:
-- - gen_salt() - Generate salt for password hashing
-- - crypt() - Hash passwords using various algorithms (bf = bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'pgcrypto extension failed to install';
  END IF;

  RAISE NOTICE 'pgcrypto extension is enabled successfully';
END $$;

-- Test that gen_salt works
DO $$
DECLARE
  test_salt TEXT;
BEGIN
  -- Test gen_salt with bcrypt (bf) and cost factor 10
  test_salt := gen_salt('bf', 10);

  IF test_salt IS NULL OR LENGTH(test_salt) = 0 THEN
    RAISE EXCEPTION 'gen_salt function is not working properly';
  END IF;

  RAISE NOTICE 'gen_salt function test passed';
END $$;

-- Recreate the rotate_staff_pin function to ensure it works with pgcrypto
-- This function is used by admin to generate/rotate school PINs
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
  v_current_role TEXT;
BEGIN
  -- Get current role for logging
  v_current_role := current_setting('role', true);

  -- Validate inputs
  IF p_school_id IS NULL THEN
    RETURN QUERY SELECT false, 'School ID is required'::TEXT;
    RETURN;
  END IF;

  IF p_new_pin IS NULL OR LENGTH(p_new_pin) < 4 THEN
    RETURN QUERY SELECT false, 'PIN must be at least 4 digits'::TEXT;
    RETURN;
  END IF;

  -- Hash the new PIN using bcrypt
  v_new_hash := crypt(p_new_pin, gen_salt('bf', 10));

  -- Check if PIN already exists for school
  SELECT EXISTS(
    SELECT 1 FROM school_staff_credentials
    WHERE school_id = p_school_id
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

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION rotate_staff_pin IS 'Generates or rotates a bcrypt-hashed PIN for school staff authentication. Requires pgcrypto extension.';
