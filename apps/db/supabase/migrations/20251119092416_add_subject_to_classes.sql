ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS subject text;

COMMENT ON COLUMN public.classes.subject IS 'Subject or topic taught in this class (e.g., Mathematics, English, Science)';;
