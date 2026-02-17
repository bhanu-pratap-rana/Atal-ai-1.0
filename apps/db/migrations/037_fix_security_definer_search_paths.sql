-- Migration: 037_fix_security_definer_search_paths
-- Description: Fix all SECURITY DEFINER functions to include SET search_path
-- Priority: P0-CRITICAL
-- Date: 2024-12-18
-- Issue: CWE-426 - Untrusted Search Path vulnerability

-- ============================================================================
-- Fix 1: create_user_on_teacher_profile() - from migration 013
-- ============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.create_user_on_teacher_profile() IS
  'Trigger: Auto-creates user record in public.users when teacher profile inserted. SECURITY DEFINER with empty search_path for security.';

-- ============================================================================
-- Fix 2: create_user_on_student_profile() - from migration 033
-- ============================================================================
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

COMMENT ON FUNCTION public.create_user_on_student_profile() IS
  'Trigger: Auto-creates user record in public.users when student profile inserted. SECURITY DEFINER with empty search_path for security.';

-- ============================================================================
-- Fix 3: ensure_user_exists_for_enrollment() - from migration 033
-- ============================================================================
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

COMMENT ON FUNCTION public.ensure_user_exists_for_enrollment() IS
  'Trigger: Ensures user exists in public.users before enrollment insert. SECURITY DEFINER with empty search_path for security.';

-- ============================================================================
-- Fix 4: verify_staff_pin() - from migration 016
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_staff_pin(
  p_school_id UUID,
  p_pin TEXT
) RETURNS TABLE (
  is_valid BOOLEAN,
  pin_id UUID,
  school_id UUID
) AS $$
DECLARE
  v_pin_hash TEXT;
  v_pin_id UUID;
  v_school_id UUID;
BEGIN
  -- Security: Only allow service role to call this function
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'verify_staff_pin: Unauthorized - only service role can verify PINs';
  END IF;

  -- Get the PIN hash for this school
  SELECT
    id,
    ssc.school_id,
    pin_hash
  INTO
    v_pin_id,
    v_school_id,
    v_pin_hash
  FROM public.school_staff_credentials ssc
  WHERE ssc.school_id = p_school_id
  AND deleted_at IS NULL;

  -- If no PIN found, return false (not valid)
  IF v_pin_hash IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Compare PIN using crypt (bcrypt comparison)
  IF public.crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    RETURN QUERY SELECT TRUE, v_pin_id, v_school_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.verify_staff_pin(UUID, TEXT) IS
  'Verifies staff PIN against bcrypt hash. Service role only. SECURITY DEFINER with public search_path.';

-- ============================================================================
-- Fix 5: rotate_staff_pin() - from migration 016
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rotate_staff_pin(
  p_school_id UUID,
  p_new_pin TEXT
) RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_pin TEXT
) AS $$
DECLARE
  v_new_hash TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Security: Only allow service role (from verified server actions)
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Unauthorized: Only server actions can rotate PINs'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Validate PIN format (4-8 digits)
  IF NOT (p_new_pin ~ '^\d{4,8}$') THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      'Invalid PIN format: Must be 4-8 digits'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Hash the new PIN using bcrypt
  v_new_hash := public.crypt(p_new_pin, public.gen_salt('bf', 10));

  -- Check if PIN already exists for school
  SELECT EXISTS(
    SELECT 1 FROM public.school_staff_credentials
    WHERE school_id = p_school_id AND deleted_at IS NULL
  ) INTO v_exists;

  IF v_exists THEN
    -- Update existing PIN
    UPDATE public.school_staff_credentials
    SET
      pin_hash = v_new_hash,
      rotated_at = NOW(),
      updated_at = NOW()
    WHERE school_id = p_school_id AND deleted_at IS NULL;
  ELSE
    -- Insert new PIN
    INSERT INTO public.school_staff_credentials (
      school_id,
      pin_hash,
      rotated_at,
      created_at,
      updated_at
    ) VALUES (
      p_school_id,
      v_new_hash,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Return success with the PIN (to be sent to admin via secure channel)
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    NULL::TEXT,
    p_new_pin::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.rotate_staff_pin(UUID, TEXT) IS
  'Rotates staff PIN with bcrypt hashing. Service role only. SECURITY DEFINER with public search_path.';

-- ============================================================================
-- Add missing FK indexes for performance
-- ============================================================================

-- Index on student_profiles.school_id for efficient school student lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id
ON public.student_profiles(school_id)
WHERE school_id IS NOT NULL;

-- Index on enrollments.class_id for efficient class enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id
ON public.enrollments(class_id)
WHERE class_id IS NOT NULL;

-- Index on teacher_profiles.school_id for efficient school teacher lookups
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school_id
ON public.teacher_profiles(school_id)
WHERE school_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_student_profiles_school_id IS
  'Index for efficient lookup of students by school_id. Speeds up school analytics queries.';

COMMENT ON INDEX idx_enrollments_class_id IS
  'Index for efficient lookup of enrollments by class_id. Speeds up roster queries.';

COMMENT ON INDEX idx_teacher_profiles_school_id IS
  'Index for efficient lookup of teachers by school_id. Speeds up school management queries.';
