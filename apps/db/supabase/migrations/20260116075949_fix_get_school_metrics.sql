-- Migration 127: Fix get_school_metrics() function schema mismatches
-- Issue: Migration 125 referenced incorrect column names
-- Fix: Use correct table names and join paths

DROP FUNCTION IF EXISTS get_school_metrics();

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
    -- Use school_staff_credentials instead of non-existent "pins" table
    COUNT(DISTINCT ssc.id) FILTER (WHERE ssc.deleted_at IS NULL) as active_pin_count,
    -- Join classes via teacher_profiles (no direct school_id on classes table)
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
'Returns aggregated metrics for all schools (admin only). Fixed schema references:
- Uses school_staff_credentials instead of non-existent pins table
- Joins classes via teacher_profiles.user_id (no school_id on classes table)';;
