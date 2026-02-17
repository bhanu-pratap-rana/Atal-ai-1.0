-- Migration: Auto-create user in public.users when student profile is created
-- Problem: enrollments.student_id references public.users.id, but students signing up
-- via Supabase Auth (email OTP, phone OTP, username, anonymous) only exist in auth.users
-- Solution: Create a trigger similar to teacher_profile_create_user

-- Create a trigger function to auto-insert into users table when student profile is created
CREATE OR REPLACE FUNCTION public.create_user_on_student_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
BEGIN
  -- Get email from auth.users, use phone or placeholder if no email
  SELECT COALESCE(au.email, au.phone, 'student_' || NEW.user_id::text || '@placeholder.local')
  INTO v_email
  FROM auth.users au
  WHERE au.id = NEW.user_id;

  -- Insert into users table if user doesn't already exist
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (
    NEW.user_id,
    v_email,
    'student'::text,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS student_profile_create_user ON public.student_profiles;

-- Create the trigger to fire when a student profile is inserted
CREATE TRIGGER student_profile_create_user
  AFTER INSERT ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_on_student_profile();

-- Also create user record for anonymous users when they join a class directly
-- This handles the case where student joins class BEFORE creating profile
CREATE OR REPLACE FUNCTION public.ensure_user_exists_for_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_role text;
BEGIN
  -- Check if user already exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.student_id) THEN
    -- Get email from auth.users
    SELECT COALESCE(au.email, au.phone, 'student_' || NEW.student_id::text || '@placeholder.local')
    INTO v_email
    FROM auth.users au
    WHERE au.id = NEW.student_id;

    -- Insert as student
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (
      NEW.student_id,
      v_email,
      'student'::text,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS enrollment_ensure_user ON public.enrollments;

-- Create the trigger to fire BEFORE enrollment insert
CREATE TRIGGER enrollment_ensure_user
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_exists_for_enrollment();

-- Backfill: Create user records for any existing student profiles without user entries
INSERT INTO public.users (id, email, role, created_at)
SELECT DISTINCT
  sp.user_id,
  COALESCE(au.email, au.phone, 'student_' || sp.user_id::text || '@placeholder.local'),
  'student'::text,
  sp.created_at
FROM public.student_profiles sp
JOIN auth.users au ON au.id = sp.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = sp.user_id)
ON CONFLICT (id) DO NOTHING;

COMMENT ON FUNCTION public.create_user_on_student_profile() IS
'Auto-creates a user record in public.users when a student profile is created';

COMMENT ON FUNCTION public.ensure_user_exists_for_enrollment() IS
'Ensures user exists in public.users before enrollment insert (handles guest/anonymous users)';
