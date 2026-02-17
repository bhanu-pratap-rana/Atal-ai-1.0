-- Create lesson-assets storage bucket for Imagen-generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-assets',
  'lesson-assets',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for lesson-assets
CREATE POLICY "Public read access for lesson-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-assets');

-- Allow authenticated uploads for lesson-assets
CREATE POLICY "Authenticated upload for lesson-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-assets' AND auth.role() = 'authenticated');

-- Allow service role / authenticated to update (for upsert)
CREATE POLICY "Authenticated update for lesson-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesson-assets')
WITH CHECK (bucket_id = 'lesson-assets');;
