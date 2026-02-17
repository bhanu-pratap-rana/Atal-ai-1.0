-- =====================================================
-- Migration 146: Fix Multiple Permissive Policies
-- =====================================================
--
-- PERFORMANCE FIX:
-- The modules and topics tables have two overlapping policies:
-- 1. modules_public_read / topics_public_read - FOR SELECT USING (true)
-- 2. modules_service_role_all / topics_service_role_all - FOR ALL
--
-- Since both policies apply to SELECT, PostgreSQL evaluates BOTH
-- for every query, which is inefficient.
--
-- SOLUTION:
-- Change service_role policies from FOR ALL to only FOR INSERT, UPDATE, DELETE
-- This way SELECT uses only the public_read policy (single evaluation)
--
-- =====================================================

-- =====================================================
-- FIX: modules table - split service_role policy by action
-- =====================================================

-- Drop the FOR ALL policy
DROP POLICY IF EXISTS "modules_service_role_all" ON public.modules;

-- Create separate policies for INSERT, UPDATE, DELETE only
-- SELECT is already handled by modules_public_read

CREATE POLICY modules_service_role_insert ON public.modules
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY modules_service_role_update ON public.modules
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY modules_service_role_delete ON public.modules
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role');

-- =====================================================
-- FIX: topics table - split service_role policy by action
-- =====================================================

-- Drop the FOR ALL policy
DROP POLICY IF EXISTS "topics_service_role_all" ON public.topics;

-- Create separate policies for INSERT, UPDATE, DELETE only
-- SELECT is already handled by topics_public_read

CREATE POLICY topics_service_role_insert ON public.topics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY topics_service_role_update ON public.topics
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY topics_service_role_delete ON public.topics
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role');

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON POLICY modules_service_role_insert ON public.modules IS
  'Service role can insert modules. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

COMMENT ON POLICY modules_service_role_update ON public.modules IS
  'Service role can update modules. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

COMMENT ON POLICY modules_service_role_delete ON public.modules IS
  'Service role can delete modules. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

COMMENT ON POLICY topics_service_role_insert ON public.topics IS
  'Service role can insert topics. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

COMMENT ON POLICY topics_service_role_update ON public.topics IS
  'Service role can update topics. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

COMMENT ON POLICY topics_service_role_delete ON public.topics IS
  'Service role can delete topics. Split from FOR ALL in migration 146 to avoid multiple permissive policy overhead.';

-- =====================================================
-- Notify PostgREST to reload schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification
-- =====================================================
-- After running, check that SELECT queries only use one policy:
--
-- SELECT polname, polcmd FROM pg_policy
-- WHERE polrelid = 'public.modules'::regclass;
--
-- Expected: modules_public_read (SELECT), modules_service_role_insert (INSERT),
--           modules_service_role_update (UPDATE), modules_service_role_delete (DELETE)
--
-- No more "multiple permissive policies" warning for SELECT action!
-- =====================================================
