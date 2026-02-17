
-- Create a public function to check if email exists
-- This function does NOT require authentication and can be called during signup
-- It bypasses RLS by using SECURITY DEFINER with specific table access

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS TABLE (
  email_exists BOOLEAN,
  user_role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- Check if email exists in users table
  SELECT id, role INTO v_user_id, v_user_role
  FROM public.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
  
  -- Return results
  IF v_user_id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_user_role;
  ELSE
    RETURN QUERY SELECT false, NULL;
  END IF;
END;
$$;

-- Grant EXECUTE permission to anonymous users (for signup)
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;

-- Add comment explaining the function
COMMENT ON FUNCTION public.check_email_exists(TEXT) IS 
'Public function to check email existence during signup. 
Uses SECURITY DEFINER to bypass RLS for unauthenticated access.
Safe because it only returns email existence and role, no sensitive data.';
;
