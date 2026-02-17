-- Fix school_staff_credentials RLS policies that have old names from migration 010
-- These policies were recreated with different names in migration 016

-- Drop old policies if they exist (from migration 010)
DROP POLICY IF EXISTS "staff_creds_read_for_verification" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_for_admins" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_for_admins" ON public.school_staff_credentials;

-- Drop the service-only policies from migration 016 to recreate with optimized auth.jwt() calls
DROP POLICY IF EXISTS "staff_creds_read_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_insert_service_only" ON public.school_staff_credentials;
DROP POLICY IF EXISTS "staff_creds_update_service_only" ON public.school_staff_credentials;

-- Recreate with optimized (select auth.jwt()) calls
CREATE POLICY "staff_creds_read_service_only" ON public.school_staff_credentials
  FOR SELECT
  USING ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_insert_service_only" ON public.school_staff_credentials
  FOR INSERT
  WITH CHECK ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "staff_creds_update_service_only" ON public.school_staff_credentials
  FOR UPDATE
  USING ((select auth.jwt()) ->> 'role' = 'service_role');;
