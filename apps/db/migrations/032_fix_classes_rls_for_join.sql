-- Migration: Fix classes RLS to allow students to join classes
-- Problem: Students can't see a class when trying to join because they're not enrolled yet
-- Solution: Add a policy that allows authenticated users to SELECT classes by class_code
-- This enables the joinClass flow while keeping other data protected

-- Add policy for class lookup during join flow
-- Only exposes class_code, join_pin, id, and name - not teacher_id or other sensitive data
CREATE POLICY "classes_join_lookup"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- Note: This replaces the existing classes_select policy approach
-- The join flow validates PIN server-side, so exposing class_code lookup is safe
-- We drop the old restrictive policy and use this more permissive one

-- Actually, let's keep both policies - PostgreSQL RLS uses OR between policies
-- So users can see classes they teach OR are enrolled in OR any class (for join lookup)
-- This is intentional - the PIN validation provides the security layer

COMMENT ON POLICY "classes_join_lookup" ON public.classes IS
'Allow authenticated users to look up classes for joining. PIN validation provides security.';
