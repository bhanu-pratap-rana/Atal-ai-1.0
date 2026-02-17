-- =====================================================
-- Migration 142: Fix Class Leaderboard Student Name
-- =====================================================
--
-- Bug Fix: Migration 126 incorrectly referenced non-existent columns
--
-- PROBLEM:
-- Migration 126 used: sp.first_name || ' ' || sp.last_name
-- But student_profiles table only has: sp.name (created in migration 023)
-- This caused the leaderboard to show 'Unknown' for all students
--
-- ADDITIONAL ISSUE:
-- Two function signatures exist (046: UUID, 126: TEXT) causing ambiguity
-- We need to drop both and create a single unified version
--
-- SOLUTION:
-- 1. Drop both existing function signatures
-- 2. Create single function with TEXT parameter (more flexible)
-- 3. Use correct sp.name column reference
--
-- =====================================================

-- Drop both existing function signatures to avoid ambiguity
DROP FUNCTION IF EXISTS get_class_leaderboard(UUID, INT);
DROP FUNCTION IF EXISTS get_class_leaderboard(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_class_leaderboard(
  p_class_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  total_points BIGINT,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH student_points AS (
    SELECT
      e.student_id,
      -- FIX: Use sp.name instead of sp.first_name || ' ' || sp.last_name
      -- student_profiles table has 'name' column, not first_name/last_name
      COALESCE(sp.name, 'Unknown') as student_name,
      COALESCE(SUM(ph.points), 0) as total_points
    FROM enrollments e
    LEFT JOIN student_profiles sp ON e.student_id = sp.user_id
    LEFT JOIN points_history ph ON e.student_id = ph.student_id
    WHERE e.class_id = p_class_id::UUID
    GROUP BY e.student_id, sp.name
  )
  SELECT
    sp.student_id,
    sp.student_name,
    sp.total_points,
    ROW_NUMBER() OVER (ORDER BY sp.total_points DESC)::INTEGER as rank
  FROM student_points sp
  ORDER BY sp.total_points DESC
  LIMIT p_limit;
END;
$$;

-- Grant execution to authenticated users (teachers and students)
GRANT EXECUTE ON FUNCTION get_class_leaderboard(TEXT, INTEGER) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_class_leaderboard IS
'Returns top students by points for a class with their rankings. '
'Fixed in migration 142 to use correct sp.name column from student_profiles.';

-- =====================================================
-- Verification
-- =====================================================
-- Run after migration to verify fix:
-- SELECT * FROM get_class_leaderboard('your-class-id-here', 10);
-- Student names should now display correctly instead of 'Unknown'
-- =====================================================
