-- Fix search_path security warnings for all functions

-- Fix create_user_on_teacher_profile
CREATE OR REPLACE FUNCTION public.create_user_on_teacher_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into public.users if not exists
  INSERT INTO public.users (id, email, display_name, role, created_at, updated_at)
  VALUES (
    NEW.user_id,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    NEW.name,
    'teacher',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = 'teacher',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Fix generate_class_code
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-char alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if already exists
    SELECT EXISTS(SELECT 1 FROM public.classes WHERE class_code = code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Fix generate_join_pin
CREATE OR REPLACE FUNCTION public.generate_join_pin()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pin TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 4-digit PIN
    pin := lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Check if already exists
    SELECT EXISTS(SELECT 1 FROM public.classes WHERE join_pin = pin) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN pin;
END;
$$;

-- Fix auto_generate_class_credentials
CREATE OR REPLACE FUNCTION public.auto_generate_class_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Generate class_code if not provided
  IF NEW.class_code IS NULL THEN
    NEW.class_code := public.generate_class_code();
  END IF;
  
  -- Generate join_pin if not provided
  IF NEW.join_pin IS NULL THEN
    NEW.join_pin := public.generate_join_pin();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_assessment_session_updated_at
CREATE OR REPLACE FUNCTION public.update_assessment_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;;
