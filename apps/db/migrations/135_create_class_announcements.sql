-- =====================================================
-- Migration 135: Create class_announcements table
-- =====================================================
--
-- Allows teachers to post announcements to their classes.
-- Part of the Teacher Communication feature.
--
-- =====================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS class_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_class
  ON class_announcements(class_id);

CREATE INDEX IF NOT EXISTS idx_announcements_teacher
  ON class_announcements(teacher_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created
  ON class_announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_priority
  ON class_announcements(priority)
  WHERE priority IN ('high', 'urgent');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_announcement_updated_at
  BEFORE UPDATE ON class_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcement_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

-- Teachers can manage announcements for their own classes
CREATE POLICY "teachers_manage_own_announcements"
  ON class_announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Students can read announcements for classes they are enrolled in
CREATE POLICY "students_read_class_announcements"
  ON class_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_announcements.class_id
      AND e.student_id = auth.uid()
    )
  );

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON TABLE class_announcements IS 'Announcements posted by teachers to their classes';
COMMENT ON COLUMN class_announcements.id IS 'Unique identifier for the announcement';
COMMENT ON COLUMN class_announcements.class_id IS 'Reference to the class';
COMMENT ON COLUMN class_announcements.teacher_id IS 'Teacher who created the announcement';
COMMENT ON COLUMN class_announcements.title IS 'Announcement title/subject';
COMMENT ON COLUMN class_announcements.body IS 'Full announcement text (supports markdown)';
COMMENT ON COLUMN class_announcements.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN class_announcements.is_pinned IS 'Whether announcement is pinned to top';
COMMENT ON COLUMN class_announcements.created_at IS 'When announcement was created';
COMMENT ON COLUMN class_announcements.updated_at IS 'When announcement was last updated';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
