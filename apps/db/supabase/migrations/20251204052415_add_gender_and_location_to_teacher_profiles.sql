-- ============================================================================
-- ADD GENDER AND LOCATION TO TEACHER_PROFILES
-- ============================================================================
-- Adding missing fields to match the teacher onboarding flow requirements
-- ============================================================================

-- Add gender column
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add village/location column
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS village TEXT;

-- Add updated_at column for tracking changes
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_teacher_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teacher_profiles_updated_at ON public.teacher_profiles;
CREATE TRIGGER teacher_profiles_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_profile_updated_at();

-- Add comments
COMMENT ON COLUMN public.teacher_profiles.gender IS 'Teacher gender: male or female';
COMMENT ON COLUMN public.teacher_profiles.village IS 'Village or location name';;
