-- ============================================================================
-- CREATE STUDENT_PROFILES TABLE
-- ============================================================================
-- Stores profile details for all students (anonymous and email-authenticated)
-- This is mandatory data collected after sign-in, before dashboard access
-- ============================================================================

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,  -- For records only, no OTP verification
  roll_number TEXT,
  school_id UUID REFERENCES public.schools(id),
  school_name TEXT,  -- Denormalized for display (in case school not in our list)
  class_name TEXT,  -- e.g., "Class 5", "Class 8"
  village TEXT,  -- Village or location name
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Create index for school lookup
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON public.student_profiles(school_id);

-- ============================================================================
-- RLS POLICIES FOR STUDENT_PROFILES
-- ============================================================================

-- Students (including anonymous) can read their own profile
CREATE POLICY "student_profile_self_read" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Students (including anonymous) can create their own profile
CREATE POLICY "student_profile_self_insert" ON public.student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Students (including anonymous) can update their own profile
CREATE POLICY "student_profile_self_update" ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- Teachers can view profiles of students in their classes
CREATE POLICY "student_profile_teacher_read" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (
    (select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) = false
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = student_profiles.user_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- ============================================================================
-- UPDATE TRIGGER FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_student_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_student_profile_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.student_profiles IS 'Student profile details collected after sign-in (both anonymous and email)';
COMMENT ON COLUMN public.student_profiles.phone IS 'Phone number for records only - no OTP verification';
COMMENT ON COLUMN public.student_profiles.school_name IS 'Denormalized school name for display when school not in our list';
COMMENT ON COLUMN public.student_profiles.class_name IS 'Student class level like Class 5, Class 8';
COMMENT ON COLUMN public.student_profiles.village IS 'Village or location name';
COMMENT ON COLUMN public.student_profiles.gender IS 'Student gender: male or female';;
