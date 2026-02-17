-- =====================================================
-- Migration 046: Create Class Leaderboard Function
-- =====================================================
-- This function returns the class leaderboard with student rankings by points.
-- Used by the Leaderboard component to display class-based rankings.
-- =====================================================

CREATE OR REPLACE FUNCTION get_class_leaderboard(
  p_class_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  total_points bigint,
  badge_count bigint,
  streak_days int,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.user_id AS student_id,
    sp.name AS student_name,
    COALESCE(SUM(ph.points), 0)::bigint AS total_points,
    COUNT(DISTINCT sb.badge_id)::bigint AS badge_count,
    0 AS streak_days,  -- Streak calculation can be added later
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.points), 0) DESC)::bigint AS rank
  FROM enrollments e
  JOIN student_profiles sp ON e.student_id = sp.user_id
  LEFT JOIN points_history ph ON sp.user_id = ph.student_id
  LEFT JOIN student_badges sb ON sp.user_id = sb.student_id
  WHERE e.class_id = p_class_id
  GROUP BY sp.user_id, sp.name
  ORDER BY total_points DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_class_leaderboard IS
  'Returns class leaderboard with student rankings by points. Class-based ranking promotes healthy competition within peer groups.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_class_leaderboard TO authenticated;
