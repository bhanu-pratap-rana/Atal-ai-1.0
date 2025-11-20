-- Add subject field to classes table
-- This allows storing the subject/topic for each class

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS subject text;

-- Add helpful comment
COMMENT ON COLUMN public.classes.subject IS 'Subject or topic taught in this class (e.g., Mathematics, English, Science)';
