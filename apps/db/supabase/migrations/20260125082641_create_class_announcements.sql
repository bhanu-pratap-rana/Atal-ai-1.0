-- Migration 135: Create class_announcements table
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

CREATE INDEX IF NOT EXISTS idx_announcements_class ON class_announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON class_announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON class_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON class_announcements(priority) WHERE priority IN ('high', 'urgent');

CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trigger_update_announcement_updated_at
  BEFORE UPDATE ON class_announcements FOR EACH ROW
  EXECUTE FUNCTION update_announcement_updated_at();

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_own_announcements" ON class_announcements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_announcements.class_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_announcements.class_id AND c.teacher_id = auth.uid()));

CREATE POLICY "students_read_class_announcements" ON class_announcements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = class_announcements.class_id AND e.student_id = auth.uid()));

COMMENT ON TABLE class_announcements IS 'Announcements posted by teachers to their classes';
NOTIFY pgrst, 'reload schema';;
