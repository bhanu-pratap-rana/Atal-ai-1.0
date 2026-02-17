-- =====================================================
-- Learning Style Detection Helper Functions
-- =====================================================

-- Increment visual score when student views images
CREATE OR REPLACE FUNCTION increment_visual_score(p_student_id UUID, p_time_seconds INTEGER DEFAULT 5)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_increment DECIMAL(5,2);
BEGIN
  -- Calculate increment based on time (max 2 points per interaction)
  v_increment := LEAST(p_time_seconds / 10.0, 2.0);
  
  INSERT INTO learning_style_profile (student_id, visual_score, images_viewed)
  VALUES (p_student_id, 33.33 + v_increment, 1)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    visual_score = LEAST(learning_style_profile.visual_score + v_increment, 100),
    images_viewed = learning_style_profile.images_viewed + 1,
    updated_at = now();
END;
$$;

-- Increment auditory score when student uses voice features
CREATE OR REPLACE FUNCTION increment_auditory_score(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO learning_style_profile (student_id, auditory_score, voice_replays)
  VALUES (p_student_id, 35.33, 1)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    auditory_score = LEAST(learning_style_profile.auditory_score + 2, 100),
    voice_replays = learning_style_profile.voice_replays + 1,
    updated_at = now();
END;
$$;

-- Increment text score when student reads content
CREATE OR REPLACE FUNCTION increment_text_score(p_student_id UUID, p_time_seconds INTEGER DEFAULT 30)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_increment DECIMAL(5,2);
BEGIN
  -- Calculate increment based on reading time (max 3 points per interaction)
  v_increment := LEAST(p_time_seconds / 30.0, 3.0);
  
  INSERT INTO learning_style_profile (student_id, text_score, text_read_time_seconds)
  VALUES (p_student_id, 33.33 + v_increment, p_time_seconds)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    text_score = LEAST(learning_style_profile.text_score + v_increment, 100),
    text_read_time_seconds = learning_style_profile.text_read_time_seconds + p_time_seconds,
    updated_at = now();
END;
$$;;
