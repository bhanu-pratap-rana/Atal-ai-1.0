-- =====================================================
-- Migration 040: Fix RLS Policy and Roster Function Issues
-- =====================================================
-- Fixes:
-- 1. Replace auth.users query with JWT metadata check in irt_item_bank_admin_all policy
-- 2. Fix timestamp type mismatch in get_class_roster function
--
-- Issues addressed:
-- - "permission denied for table users" error when accessing irt_item_bank as admin
-- - "structure of query does not match function result type" error in roster function
-- =====================================================

-- =====================================================
-- FIX 1: Replace auth.users query with JWT metadata check
-- =====================================================
-- The current policy queries auth.users table which authenticated users cannot access
-- Solution: Use JWT app_metadata directly instead (recommended Supabase pattern)

DROP POLICY IF EXISTS "irt_item_bank_admin_all" ON irt_item_bank;

CREATE POLICY "irt_item_bank_admin_all"
  ON irt_item_bank
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  );

COMMENT ON POLICY "irt_item_bank_admin_all" ON irt_item_bank IS
  'Allows admin users full access to manage item bank. Uses JWT app_metadata instead of auth.users query for proper RLS compatibility.';

-- =====================================================
-- FIX 2: Fix get_class_roster function timestamp type mismatch
-- =====================================================
-- The function returns enrolled_at as TIMESTAMPTZ but enrollments.created_at is TIMESTAMP
-- Solution: Use the correct column (enrolled_at) which is already TIMESTAMPTZ

CREATE OR REPLACE FUNCTION get_class_roster(p_class_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  roll_number TEXT,
  class_name TEXT,
  enrolled_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Verify the current user is the teacher of this class
  IF NOT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
    AND teacher_id = (SELECT auth.uid())
  ) THEN
    -- Return empty result if not the class teacher
    RETURN;
  END IF;

  -- Return roster data
  -- Using enrolled_at (TIMESTAMPTZ) instead of created_at (TIMESTAMP) to match return type
  RETURN QUERY
  SELECT
    e.id AS enrollment_id,
    e.student_id,
    sp.name AS student_name,
    sp.phone AS student_phone,
    sp.roll_number,
    sp.class_name,
    e.enrolled_at AS enrolled_at
  FROM enrollments e
  LEFT JOIN student_profiles sp ON sp.user_id = e.student_id
  WHERE e.class_id = p_class_id
  ORDER BY sp.name NULLS LAST, e.enrolled_at;
END;
$$;

COMMENT ON FUNCTION get_class_roster(UUID) IS
  'Returns full roster for a class including student profiles. Only works for the class teacher. Fixed to use enrolled_at (TIMESTAMPTZ) column.';

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';
