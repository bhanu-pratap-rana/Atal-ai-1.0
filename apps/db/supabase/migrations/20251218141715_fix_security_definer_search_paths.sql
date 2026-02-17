-- Migration: 037_fix_security_definer_search_paths
-- First drop functions that need signature changes

DROP FUNCTION IF EXISTS public.verify_staff_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.rotate_staff_pin(UUID, TEXT);

-- Fix 1: create_user_on_teacher_profile()
CREATE OR REPLACE FUNCTION public.create_user_on_teacher_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at)
  SELECT NEW.user_id, au.email, 'teacher'::text, now()
  FROM auth.users au WHERE au.id = NEW.user_id
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix 2: create_user_on_student_profile()
CREATE OR REPLACE FUNCTION public.create_user_on_student_profile()
RETURNS TRIGGER AS $$
DECLARE v_email text;
BEGIN
  SELECT COALESCE(au.email, au.phone, 'student_' || NEW.user_id::text || '@placeholder.local')
  INTO v_email FROM auth.users au WHERE au.id = NEW.user_id;
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (NEW.user_id, v_email, 'student'::text, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix 3: ensure_user_exists_for_enrollment()
CREATE OR REPLACE FUNCTION public.ensure_user_exists_for_enrollment()
RETURNS TRIGGER AS $$
DECLARE v_email text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.student_id) THEN
    SELECT COALESCE(au.email, au.phone, 'student_' || NEW.student_id::text || '@placeholder.local')
    INTO v_email FROM auth.users au WHERE au.id = NEW.student_id;
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (NEW.student_id, v_email, 'student'::text, now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix 4: verify_staff_pin() - recreate with search_path
CREATE FUNCTION public.verify_staff_pin(p_school_id UUID, p_pin TEXT)
RETURNS TABLE (is_valid BOOLEAN, pin_id UUID, school_id UUID) AS $$
DECLARE v_pin_hash TEXT; v_pin_id UUID; v_school_id UUID;
BEGIN
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'verify_staff_pin: Unauthorized';
  END IF;
  SELECT id, ssc.school_id, pin_hash INTO v_pin_id, v_school_id, v_pin_hash
  FROM public.school_staff_credentials ssc WHERE ssc.school_id = p_school_id AND deleted_at IS NULL;
  IF v_pin_hash IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID; RETURN;
  END IF;
  IF public.crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    RETURN QUERY SELECT TRUE, v_pin_id, v_school_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.verify_staff_pin(UUID, TEXT) TO authenticated;

-- Fix 5: rotate_staff_pin() - recreate with search_path
CREATE FUNCTION public.rotate_staff_pin(p_school_id UUID, p_new_pin TEXT)
RETURNS TABLE (success BOOLEAN, error_message TEXT, new_pin TEXT) AS $$
DECLARE v_new_hash TEXT; v_exists BOOLEAN;
BEGIN
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Unauthorized'::TEXT, NULL::TEXT; RETURN;
  END IF;
  IF NOT (p_new_pin ~ '^\d{4,8}$') THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Invalid PIN format'::TEXT, NULL::TEXT; RETURN;
  END IF;
  v_new_hash := public.crypt(p_new_pin, public.gen_salt('bf', 10));
  SELECT EXISTS(SELECT 1 FROM public.school_staff_credentials WHERE school_id = p_school_id AND deleted_at IS NULL) INTO v_exists;
  IF v_exists THEN
    UPDATE public.school_staff_credentials SET pin_hash = v_new_hash, rotated_at = NOW(), updated_at = NOW()
    WHERE school_id = p_school_id AND deleted_at IS NULL;
  ELSE
    INSERT INTO public.school_staff_credentials (school_id, pin_hash, rotated_at, created_at, updated_at)
    VALUES (p_school_id, v_new_hash, NOW(), NOW(), NOW());
  END IF;
  RETURN QUERY SELECT TRUE::BOOLEAN, NULL::TEXT, p_new_pin::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.rotate_staff_pin(UUID, TEXT) TO authenticated;

-- Add missing FK indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_school_id ON public.student_profiles(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school_id ON public.teacher_profiles(school_id) WHERE school_id IS NOT NULL;;
