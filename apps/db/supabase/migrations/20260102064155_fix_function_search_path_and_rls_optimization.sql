-- Migration 054: Fix function search_path and optimize RLS policy
-- Purpose: Address security advisor warnings and performance optimization
-- Date: 2026-01-02

-- FIX #1: Set search_path for submit_assessment function
ALTER FUNCTION public.submit_assessment(uuid, uuid, jsonb) SET search_path = public;

-- FIX #2: Set search_path for update_knowledge_state function
ALTER FUNCTION public.update_knowledge_state(uuid, uuid, uuid, boolean, integer, boolean) SET search_path = public;

-- FIX #3: Drop old RLS policy (will recreate with optimization)
DROP POLICY IF EXISTS irt_item_bank_admin_all ON public.irt_item_bank;

-- FIX #4: Create optimized RLS policy using (SELECT auth.uid()) pattern
-- This caches the auth.uid() result in InitPlan for better performance
CREATE POLICY irt_item_bank_admin_all ON public.irt_item_bank 
FOR ALL 
USING ((SELECT auth.uid()) = created_by) 
WITH CHECK ((SELECT auth.uid()) = created_by);

-- FIX #5: Add documentation comment
COMMENT ON POLICY irt_item_bank_admin_all ON public.irt_item_bank IS 
'Optimized RLS policy: Uses (SELECT auth.uid()) to cache the function result in InitPlan for better query performance at scale.';;
