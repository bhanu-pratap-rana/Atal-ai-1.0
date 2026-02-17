-- =====================================================
-- Migration 141: Add get_announcements_with_reads function
-- =====================================================
--
-- Creates the RPC function called by teacher-communication.ts
-- to get announcements with read counts for a class.
--
-- =====================================================

CREATE OR REPLACE FUNCTION get_announcements_with_reads(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  class_id UUID,
  title TEXT,
  body TEXT,
  priority TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  read_count INTEGER,
  total_students INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the teacher of this class
  IF NOT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id
    AND c.teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not the teacher of this class';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.class_id,
    a.title,
    a.body,
    a.priority,
    a.is_pinned,
    a.created_at,
    a.updated_at,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM announcement_reads ar
      WHERE ar.announcement_id = a.id
    ), 0) AS read_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM enrollments e
      WHERE e.class_id = p_class_id
    ), 0) AS total_students
  FROM class_announcements a
  WHERE a.class_id = p_class_id
  ORDER BY a.is_pinned DESC, a.created_at DESC;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION get_announcements_with_reads IS 'Returns announcements for a class with read counts. Teachers only.';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
