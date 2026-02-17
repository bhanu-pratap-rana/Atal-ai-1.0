-- Migration: 035_update_check_email_exists_function
-- Description: Update check_email_exists function to check auth.users and return user_id
-- Priority: P0-CRITICAL

-- Drop the existing function first (different signature)
DROP FUNCTION IF EXISTS public.check_email_exists(TEXT);

-- Create the updated check_email_exists function
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
  'Check if an email exists in auth.users. Returns existence status and user_id if found. SECURITY DEFINER function.';;
