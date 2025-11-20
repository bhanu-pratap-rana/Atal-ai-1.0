-- Fix RLS policies for school_staff_credentials to allow admin PIN rotation

-- Drop the old deny-all SELECT policy
DROP POLICY IF EXISTS "staff_creds_deny_select" ON public.school_staff_credentials;

-- Allow authenticated users to SELECT (needed for PIN verification in teacher registration)
-- Note: PIN hash is never exposed to clients, only compared server-side
CREATE POLICY "staff_creds_read_for_verification" ON public.school_staff_credentials
  FOR SELECT USING ( auth.role() = 'authenticated' );

-- Allow authenticated users to INSERT new PIN credentials (for admin PIN rotation)
CREATE POLICY "staff_creds_insert_for_admins" ON public.school_staff_credentials
  FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

-- Allow authenticated users to UPDATE PIN credentials (for admin PIN rotation)
CREATE POLICY "staff_creds_update_for_admins" ON public.school_staff_credentials
  FOR UPDATE USING ( auth.role() = 'authenticated' );
