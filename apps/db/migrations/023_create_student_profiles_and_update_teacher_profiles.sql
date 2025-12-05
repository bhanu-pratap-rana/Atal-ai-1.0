-- ============================================================================
-- CREATE STUDENT_PROFILES TABLE & UPDATE TEACHER_PROFILES
-- ============================================================================
-- This migration:
-- 1. Creates student_profiles table for all students (anonymous & email-authenticated)
-- 2. Adds gender and village columns to teacher_profiles
--
-- STUDENT FLOW (Anonymous OR Email Sign-in):
-- 1. Sign in (anonymous or email+OTP)
-- 2. Fill mandatory profile: name, phone, school, roll number, village, gender
-- 3. Land on dashboard
-- 4. Join class using class code + class PIN
-- 5. View teacher name, class name, class subject
--
-- TEACHER FLOW (Email OR Phone Sign-in):
-- 1. Sign in with email or phone + OTP
-- 2. Fill mandatory profile: name, school, school code, school PIN, location, phone, gender
-- 3. Land on dashboard
-- 4. Create/manage classes with subjects
-- 5. Share class code + PIN with students
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE STUDENT_PROFILES TABLE
-- ============================================================================

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
-- PART 2: RLS POLICIES FOR STUDENT_PROFILES
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
-- PART 3: UPDATE TRIGGER FOR STUDENT_PROFILES
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
-- PART 4: ADD MISSING COLUMNS TO TEACHER_PROFILES
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

-- Create update trigger for teacher_profiles updated_at
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

-- ============================================================================
-- PART 5: COMMENTS
-- ============================================================================

COMMENT ON TABLE public.student_profiles IS 'Student profile details collected after sign-in (both anonymous and email)';
COMMENT ON COLUMN public.student_profiles.phone IS 'Phone number for records only - no OTP verification';
COMMENT ON COLUMN public.student_profiles.school_name IS 'Denormalized school name for display when school not in our list';
COMMENT ON COLUMN public.student_profiles.class_name IS 'Student class level like Class 5, Class 8';
COMMENT ON COLUMN public.student_profiles.village IS 'Village or location name';
COMMENT ON COLUMN public.student_profiles.gender IS 'Student gender: male or female';

COMMENT ON COLUMN public.teacher_profiles.gender IS 'Teacher gender: male or female';
COMMENT ON COLUMN public.teacher_profiles.village IS 'Village or location name';

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- STUDENT_PROFILES TABLE STRUCTURE:
-- - user_id: Primary key, references auth.users
-- - name: Student's full name (required)
-- - phone: Phone number for records, no OTP (optional)
-- - roll_number: School roll number (optional)
-- - school_id: Reference to schools table (optional)
-- - school_name: Denormalized school name (for schools not in our list)
-- - class_name: Class level like "Class 5", "Class 8"
-- - village: Village or location name
-- - gender: male or female (required)
--
-- TEACHER_PROFILES UPDATES:
-- - Added gender column (male/female)
-- - Added village column (location)
-- - Added updated_at column with trigger
--
-- RLS POLICIES:
-- - Students can CRUD their own profile (including anonymous students)
-- - Teachers can view profiles of students enrolled in their classes
-- ============================================================================
