
-- Function to get class leaderboard (CLASS-BASED ranking)
-- Students are ranked within their enrolled class, not globally
CREATE OR REPLACE FUNCTION get_class_leaderboard(
  p_class_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  total_points BIGINT,
  badge_count BIGINT,
  streak_days INT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH enrolled_students AS (
    -- Get all students enrolled in this class
    SELECT e.student_id, u.full_name as student_name
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    WHERE e.class_id = p_class_id
  ),
  student_points AS (
    -- Sum all points for each enrolled student
    SELECT 
      es.student_id,
      es.student_name,
      COALESCE(SUM(ph.points), 0) as total_points
    FROM enrolled_students es
    LEFT JOIN points_history ph ON es.student_id = ph.student_id
    GROUP BY es.student_id, es.student_name
  ),
  student_badges AS (
    -- Count badges for each enrolled student
    SELECT 
      es.student_id,
      COUNT(sb.id) as badge_count
    FROM enrolled_students es
    LEFT JOIN student_badges sb ON es.student_id = sb.student_id
    GROUP BY es.student_id
  ),
  student_streaks AS (
    -- Calculate streak days based on recent activity
    SELECT 
      es.student_id,
      COALESCE(
        (SELECT COUNT(DISTINCT DATE(last_attempt_at))
         FROM student_knowledge_state sks
         WHERE sks.student_id = es.student_id
         AND sks.last_attempt_at >= CURRENT_DATE - INTERVAL '30 days'),
        0
      )::INT as streak_days
    FROM enrolled_students es
  )
  SELECT 
    sp.student_id,
    sp.student_name,
    sp.total_points,
    COALESCE(sba.badge_count, 0) as badge_count,
    COALESCE(ss.streak_days, 0) as streak_days,
    ROW_NUMBER() OVER (ORDER BY sp.total_points DESC, sp.student_name) as rank
  FROM student_points sp
  LEFT JOIN student_badges sba ON sp.student_id = sba.student_id
  LEFT JOIN student_streaks ss ON sp.student_id = ss.student_id
  ORDER BY sp.total_points DESC, sp.student_name
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_class_leaderboard(UUID, INT) TO authenticated;
;
