-- =====================================================
-- Migration 125: School Metrics Aggregation RPC
-- =====================================================
--
-- Purpose: Replace client-side pagination with database aggregation

CREATE OR REPLACE FUNCTION get_school_metrics()
RETURNS TABLE (
  school_id UUID,
  school_name TEXT,
  teacher_count BIGINT,
  student_count BIGINT,
  active_pin_count BIGINT,
  total_classes BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role' INTO v_user_role;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    s.id as school_id,
    s.school_name as school_name,
    COUNT(DISTINCT tp.user_id) as teacher_count,
    COUNT(DISTINCT sp.user_id) as student_count,
    COUNT(DISTINCT ssc.id) FILTER (WHERE ssc.deleted_at IS NULL) as active_pin_count,
    COUNT(DISTINCT c.id) as total_classes
  FROM schools s
  LEFT JOIN teacher_profiles tp ON tp.school_id = s.id
  LEFT JOIN student_profiles sp ON sp.school_id = s.id
  LEFT JOIN school_staff_credentials ssc ON ssc.school_id = s.id
  LEFT JOIN classes c ON c.teacher_id = tp.user_id
  GROUP BY s.id, s.school_name
  ORDER BY s.school_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_school_metrics() TO authenticated;

COMMENT ON FUNCTION get_school_metrics IS 
'Returns aggregated metrics for all schools (admin only). '
'Replaces memory-intensive client-side pagination with database aggregation. '
'Prevents memory exhaustion with large datasets (1000+ schools).';;
