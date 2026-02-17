-- Migration 137: Create class_materials table
CREATE TABLE IF NOT EXISTS class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('file', 'link', 'video', 'document', 'worksheet', 'image', 'other')),
  storage_path TEXT,
  external_url TEXT,
  file_url TEXT,
  topic_id TEXT,
  module_id TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT material_source_required CHECK (file_url IS NOT NULL OR external_url IS NOT NULL OR storage_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_materials_class ON class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON class_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON class_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_created ON class_materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_visible ON class_materials(is_visible) WHERE is_visible = true;

CREATE OR REPLACE FUNCTION update_material_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trigger_update_material_updated_at BEFORE UPDATE ON class_materials FOR EACH ROW EXECUTE FUNCTION update_material_updated_at();

ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_own_materials" ON class_materials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_materials.class_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_materials.class_id AND c.teacher_id = auth.uid()));

CREATE POLICY "students_read_class_materials" ON class_materials FOR SELECT TO authenticated
  USING (is_visible = true AND EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = class_materials.class_id AND e.student_id = auth.uid()));

CREATE OR REPLACE FUNCTION increment_material_download(p_material_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE class_materials SET download_count = download_count + 1 WHERE id = p_material_id; END;
$$;

CREATE OR REPLACE FUNCTION increment_material_view(p_material_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE class_materials SET view_count = view_count + 1 WHERE id = p_material_id; END;
$$;

CREATE OR REPLACE FUNCTION get_class_materials(p_class_id UUID)
RETURNS TABLE (id UUID, title TEXT, description TEXT, material_type TEXT, storage_path TEXT, external_url TEXT, file_url TEXT, file_name TEXT, file_size INTEGER, mime_type TEXT, download_count INTEGER, view_count INTEGER, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN QUERY
  SELECT m.id, m.title, m.description, m.material_type, m.storage_path, m.external_url, m.file_url, m.file_name, m.file_size, m.mime_type, m.download_count, m.view_count, m.created_at
  FROM class_materials m WHERE m.class_id = p_class_id AND m.is_visible = true ORDER BY m.created_at DESC;
END;
$$;

COMMENT ON TABLE class_materials IS 'Materials (files, links, videos) shared by teachers with their classes';
COMMENT ON FUNCTION increment_material_download IS 'Increments download count for a material';
NOTIFY pgrst, 'reload schema';;
