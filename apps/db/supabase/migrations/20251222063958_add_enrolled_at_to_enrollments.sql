-- Add explicit enrolled_at column to enrollments table
-- This provides clearer semantics than using created_at

-- Add the column with default from created_at
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS enrolled_at timestamptz;

-- Populate from created_at for existing rows
UPDATE public.enrollments 
SET enrolled_at = created_at 
WHERE enrolled_at IS NULL;

-- Set default for new rows
ALTER TABLE public.enrollments 
ALTER COLUMN enrolled_at SET DEFAULT now();

-- Add index for queries that filter by enrollment date
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at 
ON public.enrollments(enrolled_at);;
