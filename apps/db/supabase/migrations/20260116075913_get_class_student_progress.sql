-- =====================================================
-- Migration 124: Class Student Progress RPC
-- =====================================================
--
-- Purpose: Aggregate student progress for teacher dashboard
-- Performance: Reduces memory usage and query time

CREATE OR REPLACE FUNCTION get_class_student_progress(
  p_student_ids UUID[]
)
RETURNS TABLE (
  student_id UUID,
  topics_total INTEGER,
  topics_mastered INTEGER,
  topics_in_progress INTEGER,
  avg_mastery_score NUMERIC,
  last_activity TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sks.student_id,
    COUNT(*)::INTEGER as topics_total,
    COUNT(*) FILTER (WHERE sks.status = 'mastered')::INTEGER as topics_mastered,
    COUNT(*) FILTER (WHERE sks.status = 'in_progress')::INTEGER as topics_in_progress,
    ROUND(AVG(sks.mastery_score), 1) as avg_mastery_score,
    MAX(sks.updated_at) as last_activity
  FROM student_knowledge_state sks
  WHERE sks.student_id = ANY(p_student_ids)
  GROUP BY sks.student_id;
END;
$$;

-- Grant execution to authenticated users (teachers)
GRANT EXECUTE ON FUNCTION get_class_student_progress(UUID[]) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_class_student_progress IS 
'Returns aggregated progress data for multiple students. '
'Optimized for teacher dashboards displaying class-wide progress. '
'Replaces client-side filtering with database aggregation.';;
