-- =====================================================
-- Migration 151: Add get_student_total_points RPC
-- =====================================================
-- Returns sum of points for a student from points_history.
-- Used by gamification-service.getTotalPoints(); code has fallback
-- (select + reduce in JS) when RPC was missing. RLS applies (SECURITY INVOKER).
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_total_points(p_student_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::integer
  FROM points_history
  WHERE student_id = p_student_id;
$$;

COMMENT ON FUNCTION get_student_total_points(uuid) IS
  'Returns total points for a student. Used by gamification leaderboard/totals. RLS applies.';
