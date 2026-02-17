-- Migration 136: Create announcement_reads table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES class_announcements(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_student ON announcement_reads(student_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_read_at ON announcement_reads(read_at DESC);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_insert_own_reads" ON announcement_reads FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND EXISTS (SELECT 1 FROM class_announcements a JOIN enrollments e ON e.class_id = a.class_id WHERE a.id = announcement_reads.announcement_id AND e.student_id = auth.uid()));

CREATE POLICY "students_read_own_reads" ON announcement_reads FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "teachers_read_class_reads" ON announcement_reads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM class_announcements a JOIN classes c ON c.id = a.class_id WHERE a.id = announcement_reads.announcement_id AND c.teacher_id = auth.uid()));

CREATE OR REPLACE FUNCTION get_announcement_read_count(p_announcement_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN (SELECT COUNT(*)::INTEGER FROM announcement_reads WHERE announcement_id = p_announcement_id); END;
$$;

CREATE OR REPLACE FUNCTION get_unread_announcements(p_student_id UUID)
RETURNS TABLE (announcement_id UUID, class_id UUID, class_name TEXT, title TEXT, body TEXT, priority TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN QUERY
  SELECT a.id, a.class_id, c.name, a.title, a.body, a.priority, a.created_at
  FROM class_announcements a
  JOIN classes c ON c.id = a.class_id
  JOIN enrollments e ON e.class_id = a.class_id
  LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.student_id = p_student_id
  WHERE e.student_id = p_student_id AND ar.id IS NULL
  ORDER BY CASE a.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, a.created_at DESC;
END;
$$;

COMMENT ON TABLE announcement_reads IS 'Tracks which students have read which announcements';
NOTIFY pgrst, 'reload schema';;
