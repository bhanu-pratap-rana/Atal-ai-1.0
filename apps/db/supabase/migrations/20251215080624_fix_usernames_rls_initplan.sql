-- Migration: Fix usernames RLS InitPlan performance issue
-- The usernames_self_read policy was re-evaluating auth.uid() for each row
-- This migration fixes it by using the InitPlan pattern: (SELECT auth.uid())

-- Drop and recreate the policy with proper InitPlan pattern
DROP POLICY IF EXISTS "usernames_self_read" ON public.usernames;

CREATE POLICY "usernames_self_read"
ON public.usernames
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

COMMENT ON POLICY "usernames_self_read" ON public.usernames IS 'Allow authenticated users to read their own username record. Uses InitPlan pattern for optimal performance.';;
