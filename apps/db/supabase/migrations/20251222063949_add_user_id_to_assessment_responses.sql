-- Add user_id column to assessment_responses for denormalized access
-- This improves query performance by avoiding joins through assessment_sessions

-- Add the column (nullable first)
ALTER TABLE public.assessment_responses 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Populate existing rows from assessment_sessions
UPDATE public.assessment_responses ar
SET user_id = s.user_id
FROM public.assessment_sessions s
WHERE ar.session_id = s.id AND ar.user_id IS NULL;

-- Add foreign key constraint
ALTER TABLE public.assessment_responses
ADD CONSTRAINT assessment_responses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id 
ON public.assessment_responses(user_id);

-- Update RLS policy to use direct user_id check (more efficient)
DROP POLICY IF EXISTS assessment_responses_select ON public.assessment_responses;
CREATE POLICY assessment_responses_select ON public.assessment_responses
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.assessment_sessions s
            JOIN public.classes c ON c.id = s.class_id
            WHERE s.id = assessment_responses.session_id 
            AND c.teacher_id = (SELECT auth.uid())
        )
    );

-- Update INSERT policy to set user_id automatically
DROP POLICY IF EXISTS assessment_responses_insert ON public.assessment_responses;
CREATE POLICY assessment_responses_insert ON public.assessment_responses
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessment_sessions s
            WHERE s.id = assessment_responses.session_id 
            AND s.user_id = (SELECT auth.uid())
        )
    );

-- Add a trigger to auto-populate user_id on insert
CREATE OR REPLACE FUNCTION public.set_assessment_response_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Get user_id from the session
    SELECT s.user_id INTO NEW.user_id
    FROM public.assessment_sessions s
    WHERE s.id = NEW.session_id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_assessment_response_user_id_trigger ON public.assessment_responses;
CREATE TRIGGER set_assessment_response_user_id_trigger
    BEFORE INSERT ON public.assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_assessment_response_user_id();;
