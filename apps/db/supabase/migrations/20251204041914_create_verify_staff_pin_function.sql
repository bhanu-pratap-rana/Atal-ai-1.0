-- Create the missing verify_staff_pin function
-- This function is required for teacher registration PIN verification

CREATE OR REPLACE FUNCTION public.verify_staff_pin(
  p_school_id UUID,
  p_pin TEXT
) RETURNS TABLE (
  is_valid BOOLEAN,
  pin_id UUID,
  school_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin_hash TEXT;
  v_pin_id UUID;
  v_school_id UUID;
BEGIN
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

  -- Compare PIN using crypt (bcrypt comparison)
  IF crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    RETURN QUERY SELECT TRUE, v_pin_id, v_school_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(UUID, TEXT) TO service_role;

-- Also fix rotate_staff_pin to have proper search_path
CREATE OR REPLACE FUNCTION public.rotate_staff_pin(
  p_school_id UUID,
  p_new_pin TEXT
) RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_pin TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_hash TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Validate PIN format (4-8 digits)
  IF NOT (p_new_pin ~ '^\d{4,8}$') THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Invalid PIN format: Must be 4-8 digits'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Hash the new PIN using bcrypt
  v_new_hash := crypt(p_new_pin, gen_salt('bf', 10));

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

  -- Return success
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    NULL::TEXT,
    p_new_pin::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_staff_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_staff_pin(UUID, TEXT) TO service_role;;
