-- Migration: 026_fix_create_user_trigger.sql
-- Purpose: Fix the create_user_on_teacher_profile trigger to use correct column names
-- Issue: Trigger was referencing non-existent columns 'display_name' and 'updated_at' in users table

-- Drop and recreate the trigger function with correct columns
DROP FUNCTION IF EXISTS create_user_on_teacher_profile() CASCADE;

CREATE OR REPLACE FUNCTION public.create_user_on_teacher_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table if user doesn't already exist
  INSERT INTO public.users (id, email, role, created_at)
  SELECT
    NEW.user_id,
    au.email,
    'teacher'::text,
    now()
  FROM auth.users au
  WHERE au.id = NEW.user_id
  ON CONFLICT (id) DO UPDATE SET
    role = 'teacher';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER teacher_profile_create_user
  AFTER INSERT ON public.teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_on_teacher_profile();

-- Verify
SELECT 'Trigger function create_user_on_teacher_profile fixed!' AS status;
