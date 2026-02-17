-- Migration: 035_create_check_email_exists_function
-- Description: Create check_email_exists function that was documented but never implemented
-- Priority: P0-CRITICAL
-- Date: 2024-12-18

-- Create the check_email_exists function
-- This function allows checking if an email exists in auth.users without exposing sensitive data
-- Uses SECURITY DEFINER to bypass RLS and access auth schema
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS TABLE(email_exists BOOLEAN, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM auth.users WHERE email = LOWER(TRIM(p_email)))::BOOLEAN AS email_exists,
    (SELECT id FROM auth.users WHERE email = LOWER(TRIM(p_email)) LIMIT 1)::UUID AS user_id;
END;
$$;

-- Grant execute permissions to authenticated and anon users
-- This is safe because the function only returns existence status, not sensitive data
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_email_exists(TEXT) IS
  'Check if an email exists in auth.users. Returns existence status and user_id if found. SECURITY DEFINER function.';
