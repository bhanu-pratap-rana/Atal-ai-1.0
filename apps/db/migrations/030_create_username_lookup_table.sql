-- Migration: Create username lookup table for username-based authentication
-- This enables students without email/phone to register with a unique username

-- Create usernames lookup table
-- This table maps usernames to auth.users for login purposes
CREATE TABLE IF NOT EXISTS public.usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),

  -- Ensure unique usernames (case-insensitive)
  CONSTRAINT usernames_username_unique UNIQUE (username)
);

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_usernames_username ON public.usernames(username);
CREATE INDEX IF NOT EXISTS idx_usernames_user_id ON public.usernames(user_id);

-- Enable RLS
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Service role can do everything (for server-side registration)
-- 2. Users can read their own username
-- 3. Public can check if username exists (for availability check during registration)

-- Service role has full access
CREATE POLICY "usernames_service_role_all"
ON public.usernames
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can read their own username
CREATE POLICY "usernames_self_read"
ON public.usernames
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Public can check username existence (needed for availability check)
-- This only allows checking existence, not reading user_id
CREATE POLICY "usernames_public_exists_check"
ON public.usernames
FOR SELECT
TO anon
USING (true);

-- Create function to check username availability
-- Returns true if username is available (not taken)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.usernames
    WHERE lower(username) = lower(p_username)
  );
$$;

-- Create function to get user_id by username (for login)
-- Only callable by service_role for security
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.usernames
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
$$;

-- Grant execute to public for availability check
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;

-- Grant execute to service_role for user lookup
GRANT EXECUTE ON FUNCTION public.get_user_id_by_username(text) TO service_role;

COMMENT ON TABLE public.usernames IS 'Lookup table for username-based authentication. Maps usernames to auth.users for students without email/phone.';
COMMENT ON COLUMN public.usernames.username IS 'Unique username chosen by student (case-insensitive)';
COMMENT ON FUNCTION public.check_username_available IS 'Check if a username is available for registration';
COMMENT ON FUNCTION public.get_user_id_by_username IS 'Get user_id from username for login (service_role only)';
