-- Auto-create user in users table when teacher profile is created
-- This ensures the foreign key constraint classes.teacher_id -> users.id is satisfied

-- Create a trigger function to auto-insert into users table
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
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS teacher_profile_create_user ON public.teacher_profiles;

-- Create the trigger to fire when a teacher profile is inserted
CREATE TRIGGER teacher_profile_create_user
  AFTER INSERT ON public.teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_on_teacher_profile();

-- Also update existing teacher profiles that don't have a user entry
INSERT INTO public.users (id, email, role, created_at)
SELECT DISTINCT
  tp.user_id,
  au.email,
  'teacher'::text,
  tp.created_at
FROM public.teacher_profiles tp
JOIN auth.users au ON au.id = tp.user_id
ON CONFLICT (id) DO NOTHING;
