-- =====================================================
-- Migration 137: Create class_materials table
-- =====================================================
--
-- Allows teachers to upload and share materials with their classes.
-- Materials can be files (stored in Supabase Storage) or external links.
-- Part of the Teacher Communication feature.
--
-- =====================================================

-- Class materials table
CREATE TABLE IF NOT EXISTS class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('file', 'link', 'video', 'document', 'worksheet', 'image', 'other')),
  -- For files: storage path in Supabase Storage
  storage_path TEXT,
  -- For links: external URL; for files: public/signed URL (alternate to storage_path)
  external_url TEXT,
  file_url TEXT,
  -- Optional topic/module for organization
  topic_id TEXT,
  module_id TEXT,
  -- File metadata
  file_name TEXT,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  -- Tracking
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- At least one of file_url, external_url, or storage_path must be provided
  CONSTRAINT material_source_required CHECK (
    file_url IS NOT NULL OR external_url IS NOT NULL OR storage_path IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_class
  ON class_materials(class_id);

CREATE INDEX IF NOT EXISTS idx_materials_teacher
  ON class_materials(teacher_id);

CREATE INDEX IF NOT EXISTS idx_materials_type
  ON class_materials(material_type);

CREATE INDEX IF NOT EXISTS idx_materials_created
  ON class_materials(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_materials_visible
  ON class_materials(is_visible)
  WHERE is_visible = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_material_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_material_updated_at
  BEFORE UPDATE ON class_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_material_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

-- Teachers can manage materials for their own classes
CREATE POLICY "teachers_manage_own_materials"
  ON class_materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Students can read visible materials for classes they are enrolled in
CREATE POLICY "students_read_class_materials"
  ON class_materials
  FOR SELECT
  TO authenticated
  USING (
    is_visible = true AND
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_materials.class_id
      AND e.student_id = auth.uid()
    )
  );

-- =====================================================
-- Helper functions
-- =====================================================

-- Increment download count
CREATE OR REPLACE FUNCTION increment_material_download(p_material_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE class_materials
  SET download_count = download_count + 1
  WHERE id = p_material_id;
END;
$$;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_material_view(p_material_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE class_materials
  SET view_count = view_count + 1
  WHERE id = p_material_id;
END;
$$;

-- Get materials for a class with counts
CREATE OR REPLACE FUNCTION get_class_materials(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  material_type TEXT,
  storage_path TEXT,
  external_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  download_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.description,
    m.material_type,
    m.storage_path,
    m.external_url,
    m.file_url,
    m.file_name,
    m.file_size,
    m.mime_type,
    m.download_count,
    m.view_count,
    m.created_at
  FROM class_materials m
  WHERE m.class_id = p_class_id
    AND m.is_visible = true
  ORDER BY m.created_at DESC;
END;
$$;

-- =====================================================
-- Storage bucket for class materials
-- =====================================================
-- Note: Storage bucket should be created via Supabase Dashboard or CLI:
--   supabase storage create class-materials --public
--
-- RLS policies for storage bucket should allow:
--   - Teachers to upload to their class folders
--   - Students to download from their class folders

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON TABLE class_materials IS 'Materials (files, links, videos) shared by teachers with their classes';
COMMENT ON COLUMN class_materials.id IS 'Unique identifier for the material';
COMMENT ON COLUMN class_materials.class_id IS 'Reference to the class';
COMMENT ON COLUMN class_materials.teacher_id IS 'Teacher who uploaded the material';
COMMENT ON COLUMN class_materials.title IS 'Display title for the material';
COMMENT ON COLUMN class_materials.description IS 'Optional description of the material';
COMMENT ON COLUMN class_materials.material_type IS 'Type: file, link, video, document, worksheet';
COMMENT ON COLUMN class_materials.storage_path IS 'Path in Supabase Storage (for uploaded files)';
COMMENT ON COLUMN class_materials.external_url IS 'External URL (for links/videos)';
COMMENT ON COLUMN class_materials.file_url IS 'Public or signed URL for files (alternative to storage_path when URL is stored directly)';
COMMENT ON COLUMN class_materials.file_name IS 'Original filename';
COMMENT ON COLUMN class_materials.file_size IS 'File size in bytes';
COMMENT ON COLUMN class_materials.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN class_materials.download_count IS 'Number of times downloaded';
COMMENT ON COLUMN class_materials.view_count IS 'Number of times viewed';
COMMENT ON COLUMN class_materials.is_visible IS 'Whether material is visible to students';

COMMENT ON FUNCTION increment_material_download IS 'Increments download count for a material';
COMMENT ON FUNCTION increment_material_view IS 'Increments view count for a material';
COMMENT ON FUNCTION get_class_materials IS 'Returns visible materials for a class';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
