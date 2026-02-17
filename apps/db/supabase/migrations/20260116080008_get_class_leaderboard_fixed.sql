-- Migration 126: Class Leaderboard RPC (Fixed)
-- Drop existing function first if it exists with different signature

DROP FUNCTION IF EXISTS get_class_leaderboard(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_class_leaderboard(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_class_leaderboard(
  p_class_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  total_points BIGINT,
  badge_count BIGINT,
  rank INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH student_stats AS (
    SELECT 
      e.student_id,
      sp.name as student_name,
      COALESCE(SUM(ph.points), 0) as total_points,
      COUNT(DISTINCT sb.badge_id) as badge_count
    FROM enrollments e
    LEFT JOIN student_profiles sp ON e.student_id = sp.user_id
    LEFT JOIN points_history ph ON e.student_id = ph.student_id
    LEFT JOIN student_badges sb ON e.student_id = sb.student_id
    WHERE e.class_id = p_class_id
    GROUP BY e.student_id, sp.name
  )
  SELECT 
    ss.student_id,
    ss.student_name,
    ss.total_points,
    ss.badge_count,
    ROW_NUMBER() OVER (ORDER BY ss.total_points DESC, ss.badge_count DESC)::INTEGER as rank
  FROM student_stats ss
  ORDER BY ss.total_points DESC, ss.badge_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_class_leaderboard(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_class_leaderboard IS 
'Returns top students by points for a class with their rankings. '
'Optimized single-query implementation with JOINs. '
'Replaces 3-query pattern (enrollments + points + profiles).';;
