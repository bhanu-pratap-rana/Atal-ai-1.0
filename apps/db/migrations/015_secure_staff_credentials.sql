-- CRITICAL SECURITY FIX: Secure staff_credentials table access
-- Previous migration (010) allowed ANY authenticated user to read PIN hashes
-- This migration restricts access to service role only (server-side verification)

-- ============================================================================
-- PART 1: Drop insecure policies
-- ============================================================================

DROP POLICY IF EXISTS "staff_creds_read_for_verification" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_for_admins" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_for_admins" ON public.school_staff_credentials;

-- ============================================================================
-- PART 2: Create secure service-role-only policies
-- ============================================================================

-- Only service role (server-side) can read PIN hashes
-- This prevents students/teachers from querying the table directly
CREATE POLICY "staff_creds_read_service_only" ON public.school_staff_credentials
  FOR SELECT
  USING (
    -- Allow read if current user is service role (from server actions)
    -- Never allow direct client reads
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- Only service role can insert (for PIN rotation via server action)
CREATE POLICY "staff_creds_insert_service_only" ON public.school_staff_credentials
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- Only service role can update (for PIN rotation via server action)
CREATE POLICY "staff_creds_update_service_only" ON public.school_staff_credentials
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ============================================================================
-- PART 3: Create secure verification function
-- ============================================================================
-- This function is the ONLY way to verify PINs
-- It's defined with SECURITY DEFINER to run as postgres/admin
-- It never exposes PIN hashes to clients

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
BEGIN
  -- Security: Only allow service role to call this function
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'verify_staff_pin: Unauthorized - only service role can verify PINs';
  END IF;

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
  WHERE school_id = p_school_id
  AND deleted_at IS NULL;

  -- If no PIN found, return false (not valid)
  IF v_pin_hash IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Compare PIN using crypt (bcrypt comparison)
  -- crypt() returns the encrypted password, so we compare if the result matches the hash
  IF crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    RETURN QUERY SELECT TRUE, v_pin_id, v_school_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function to authenticated users (but function checks role internally)
GRANT EXECUTE ON FUNCTION verify_staff_pin(UUID, TEXT) TO authenticated;

-- ============================================================================
-- PART 4: Create function to rotate staff PIN (admin only)
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
BEGIN
  -- Security: Only allow service role (from verified server actions)
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Unauthorized: Only server actions can rotate PINs'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

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
    WHERE school_id = p_school_id AND deleted_at IS NULL
  ) INTO v_exists;

  IF v_exists THEN
    -- Update existing PIN
    UPDATE public.school_staff_credentials
    SET
      pin_hash = v_new_hash,
      rotated_at = NOW(),
      updated_at = NOW()
    WHERE school_id = p_school_id AND deleted_at IS NULL;
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

  -- Return success with the PIN (to be sent to admin via secure channel)
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    NULL::TEXT,
    p_new_pin::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (but function checks role internally)
GRANT EXECUTE ON FUNCTION rotate_staff_pin(UUID, TEXT) TO authenticated;

-- ============================================================================
-- PART 5: Verification query (for testing only)
-- ============================================================================
-- This query shows that RLS is now properly restricting access
-- Run as different roles to verify:
--   SELECT current_user, count(*) FROM public.school_staff_credentials;
--
-- Expected results:
--   authenticated user (student/teacher): 0 rows (blocked by RLS)
--   service_role: can read all rows

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- CHANGES:
-- 1. Dropped insecure "authenticated user can read" policy
-- 2. Added service-role-only RLS policies
-- 3. Created verify_staff_pin() function for PIN verification
-- 4. Created rotate_staff_pin() function for admin PIN rotation
-- 5. Both functions use SECURITY DEFINER to run as postgres
--
-- SECURITY IMPACT:
-- BEFORE: Students could query and see PIN hashes
-- AFTER:  Only server actions (via service role) can access PIN data
--
-- TESTING:
-- 1. Verify students cannot read PIN hashes: SELECT * FROM school_staff_credentials;
-- 2. Verify PIN verification still works via server action
-- 3. Run: SELECT verify_staff_pin('school-id', '1234');
-- 4. Run: SELECT rotate_staff_pin('school-id', '5678');
-- 5. Run Playwright tests to verify login flows still work
--
-- ROLLBACK (if needed):
-- DROP FUNCTION IF EXISTS rotate_staff_pin(UUID, TEXT);
-- DROP FUNCTION IF EXISTS verify_staff_pin(UUID, TEXT);
-- Then revert to migration 010 policies (less secure, but functional)
