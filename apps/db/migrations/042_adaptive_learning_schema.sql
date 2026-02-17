-- =====================================================
-- Migration 042: Adaptive Learning Schema
-- =====================================================
-- This migration creates tables for:
-- 1. Student Knowledge State (per topic mastery tracking)
-- 2. Learning Style Profile (visual/text/auditory detection)
-- 3. AI Tutor Interactions (for teacher visibility)
-- 4. Formative Assessment Responses
-- 5. Summative Assessment Results
-- 6. Gamification (Badges, Points, Student Badges)
-- 7. Curriculum Content (for RAG with pgvector)
--
-- Based on ATAL AI Implementation Plan
-- =====================================================

-- =====================================================
-- 1. Student Knowledge State (per topic)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_knowledge_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  mastery_score DECIMAL(5,2) DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  confidence_level TEXT DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),
  attempts INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, module_id, topic_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_student_knowledge_student ON student_knowledge_state(student_id);
CREATE INDEX IF NOT EXISTS idx_student_knowledge_module ON student_knowledge_state(module_id);
CREATE INDEX IF NOT EXISTS idx_student_knowledge_topic ON student_knowledge_state(topic_id);
CREATE INDEX IF NOT EXISTS idx_student_knowledge_mastery ON student_knowledge_state(mastery_score);
CREATE INDEX IF NOT EXISTS idx_student_knowledge_status ON student_knowledge_state(status);

-- Composite index for adaptive queries
CREATE INDEX IF NOT EXISTS idx_student_knowledge_adaptive
  ON student_knowledge_state(student_id, module_id, mastery_score);

COMMENT ON TABLE student_knowledge_state IS
  'Tracks student mastery level per topic for adaptive learning';

-- =====================================================
-- 2. Learning Style Profile
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_style_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  visual_score DECIMAL(5,2) DEFAULT 33.33 CHECK (visual_score >= 0 AND visual_score <= 100),
  text_score DECIMAL(5,2) DEFAULT 33.33 CHECK (text_score >= 0 AND text_score <= 100),
  auditory_score DECIMAL(5,2) DEFAULT 33.33 CHECK (auditory_score >= 0 AND auditory_score <= 100),
  preferred_style TEXT GENERATED ALWAYS AS (
    CASE
      WHEN visual_score >= text_score AND visual_score >= auditory_score THEN 'visual'
      WHEN auditory_score >= text_score AND auditory_score >= visual_score THEN 'auditory'
      ELSE 'text'
    END
  ) STORED,
  images_viewed INTEGER DEFAULT 0,
  voice_replays INTEGER DEFAULT 0,
  text_read_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_style_student ON learning_style_profile(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_style_preferred ON learning_style_profile(preferred_style);

COMMENT ON TABLE learning_style_profile IS
  'Tracks student learning style preferences based on behavior signals';

-- =====================================================
-- 3. AI Tutor Interactions (for teacher visibility)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  topic_id TEXT,
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,
  input_mode TEXT DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'as')),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for teacher dashboard queries
CREATE INDEX IF NOT EXISTS idx_ai_interactions_student ON ai_tutor_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session ON ai_tutor_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_topic ON ai_tutor_interactions(topic_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON ai_tutor_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_language ON ai_tutor_interactions(language);

COMMENT ON TABLE ai_tutor_interactions IS
  'Logs all AI tutor conversations for teacher visibility and analytics';

-- =====================================================
-- 4. Formative Assessment Responses
-- =====================================================
CREATE TABLE IF NOT EXISTS formative_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  student_answer TEXT,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  ai_hint_requested BOOLEAN DEFAULT false,
  hint_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formative_student ON formative_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_formative_topic ON formative_responses(topic_id);
CREATE INDEX IF NOT EXISTS idx_formative_question ON formative_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_formative_correct ON formative_responses(is_correct);

COMMENT ON TABLE formative_responses IS
  'Tracks ungraded practice question responses for learning analytics';

-- =====================================================
-- 5. Summative Assessment Results
-- =====================================================
CREATE TABLE IF NOT EXISTS summative_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  practical_score INTEGER DEFAULT 0 CHECK (practical_score >= 0 AND practical_score <= 60),
  mcq_score INTEGER DEFAULT 0 CHECK (mcq_score >= 0 AND mcq_score <= 25),
  reflection_score INTEGER DEFAULT 0 CHECK (reflection_score >= 0 AND reflection_score <= 15),
  total_score INTEGER GENERATED ALWAYS AS (practical_score + mcq_score + reflection_score) STORED,
  passed BOOLEAN GENERATED ALWAYS AS (
    practical_score >= 42 AND mcq_score >= 18 AND reflection_score >= 11 AND
    (practical_score + mcq_score + reflection_score) >= 70
  ) STORED,
  badge_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (practical_score + mcq_score + reflection_score) >= 95 THEN 'distinction'
      WHEN (practical_score + mcq_score + reflection_score) >= 85 THEN 'merit'
      WHEN (practical_score + mcq_score + reflection_score) >= 70 THEN 'pass'
      ELSE 'incomplete'
    END
  ) STORED,
  attempt_number INTEGER DEFAULT 1,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, module_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_summative_student ON summative_results(student_id);
CREATE INDEX IF NOT EXISTS idx_summative_module ON summative_results(module_id);
CREATE INDEX IF NOT EXISTS idx_summative_passed ON summative_results(passed);
CREATE INDEX IF NOT EXISTS idx_summative_badge ON summative_results(badge_level);

COMMENT ON TABLE summative_results IS
  'Stores graded module assessment results with 100-point scoring (60 practical + 25 MCQ + 15 reflection)';

-- =====================================================
-- 6. Gamification: Badges
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_as TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlock_criteria JSONB NOT NULL,
  cultural_note TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  points_value INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE badges IS
  'Cultural badge definitions for gamification (Muga Silk, Gamosa, Bihu, etc.)';

-- =====================================================
-- 7. Student Badges (earned)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_earned ON student_badges(earned_at DESC);

COMMENT ON TABLE student_badges IS
  'Junction table tracking which badges each student has earned';

-- =====================================================
-- 8. Points History
-- =====================================================
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'assessment_complete', 'badge_earned', 'streak_bonus',
    'lesson_complete', 'voice_practice', 'daily_login'
  )),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_student ON points_history(student_id);
CREATE INDEX IF NOT EXISTS idx_points_source ON points_history(source);
CREATE INDEX IF NOT EXISTS idx_points_created ON points_history(created_at DESC);

COMMENT ON TABLE points_history IS
  'Audit log of all points earned by students for gamification';

-- =====================================================
-- 9. Curriculum Content (for RAG with pgvector)
-- =====================================================
-- Note: pgvector extension must be enabled first (see migration 043)
-- Using 768 dimensions for Google text-embedding-004

CREATE TABLE IF NOT EXISTS curriculum_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'as')),
  content_type TEXT NOT NULL CHECK (content_type IN (
    'curriculum', 'example', 'exercise', 'definition', 'cultural_context'
  )),
  title TEXT,
  content TEXT NOT NULL,
  -- Embedding will be added after pgvector extension is enabled
  -- embedding extensions.vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_module ON curriculum_content(module_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_topic ON curriculum_content(topic_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_language ON curriculum_content(language);
CREATE INDEX IF NOT EXISTS idx_curriculum_type ON curriculum_content(content_type);

-- Composite index for RAG queries
CREATE INDEX IF NOT EXISTS idx_curriculum_rag_query
  ON curriculum_content(language, module_id, topic_id);

COMMENT ON TABLE curriculum_content IS
  'Curriculum content chunks for RAG-based AI tutoring. Embeddings added after pgvector enabled.';

-- =====================================================
-- Update Triggers
-- =====================================================

-- Updated at trigger for student_knowledge_state
CREATE OR REPLACE FUNCTION update_student_knowledge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_student_knowledge_updated_at
  BEFORE UPDATE ON student_knowledge_state
  FOR EACH ROW
  EXECUTE FUNCTION update_student_knowledge_updated_at();

-- Updated at trigger for learning_style_profile
CREATE OR REPLACE FUNCTION update_learning_style_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_learning_style_updated_at
  BEFORE UPDATE ON learning_style_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_style_updated_at();

-- Updated at trigger for curriculum_content
CREATE OR REPLACE FUNCTION update_curriculum_content_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_curriculum_content_updated_at
  BEFORE UPDATE ON curriculum_content
  FOR EACH ROW
  EXECUTE FUNCTION update_curriculum_content_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE student_knowledge_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_style_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formative_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE summative_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_content ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own knowledge state
CREATE POLICY "students_own_knowledge_state"
  ON student_knowledge_state
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can read/write their own learning style
CREATE POLICY "students_own_learning_style"
  ON learning_style_profile
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can read/write their own AI interactions
CREATE POLICY "students_own_ai_interactions"
  ON ai_tutor_interactions
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can read/write their own formative responses
CREATE POLICY "students_own_formative_responses"
  ON formative_responses
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can read their own summative results (insert via service role)
CREATE POLICY "students_read_own_summative_results"
  ON summative_results
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- All authenticated users can read badges
CREATE POLICY "authenticated_read_badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Students can read their own earned badges
CREATE POLICY "students_read_own_badges"
  ON student_badges
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can read their own points history
CREATE POLICY "students_read_own_points"
  ON points_history
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- All authenticated users can read curriculum content
CREATE POLICY "authenticated_read_curriculum"
  ON curriculum_content
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- Teacher Access Policies (using SECURITY DEFINER functions)
-- =====================================================

-- Function to check if teacher has access to student
CREATE OR REPLACE FUNCTION teacher_has_student_access(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    WHERE e.student_id = p_student_id
    AND c.teacher_id = auth.uid()
  );
END;
$$;

-- Teachers can view enrolled students' knowledge state
CREATE POLICY "teachers_view_student_knowledge"
  ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    teacher_has_student_access(student_id)
  );

-- Teachers can view enrolled students' AI interactions
CREATE POLICY "teachers_view_student_interactions"
  ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    teacher_has_student_access(student_id)
  );

-- Teachers can view enrolled students' formative responses
CREATE POLICY "teachers_view_student_formative"
  ON formative_responses
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    teacher_has_student_access(student_id)
  );

-- Teachers can view enrolled students' summative results
CREATE POLICY "teachers_view_student_summative"
  ON summative_results
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    teacher_has_student_access(student_id)
  );

-- =====================================================
-- Admin Policies (using JWT app_metadata)
-- =====================================================

-- Admins can manage all badges
CREATE POLICY "admins_manage_badges"
  ON badges
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  );

-- Admins can manage curriculum content
CREATE POLICY "admins_manage_curriculum"
  ON curriculum_content
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    (SELECT auth.jwt()->'app_metadata'->>'role') = ANY(ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- Helper Functions for Learning Style Detection
-- =====================================================

-- Increment visual score based on image viewing time
CREATE OR REPLACE FUNCTION increment_visual_score(
  p_student_id UUID,
  p_time_seconds INTEGER DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_increment DECIMAL(5,2);
BEGIN
  -- Calculate increment based on time (max 2 points per call)
  v_increment := LEAST(p_time_seconds * 0.1, 2.0);

  INSERT INTO learning_style_profile (student_id, visual_score, images_viewed)
  VALUES (p_student_id, 33.33 + v_increment, 1)
  ON CONFLICT (student_id) DO UPDATE SET
    visual_score = LEAST(100, learning_style_profile.visual_score + v_increment),
    images_viewed = learning_style_profile.images_viewed + 1,
    updated_at = now();
END;
$$;

-- Increment auditory score based on voice replays
CREATE OR REPLACE FUNCTION increment_auditory_score(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO learning_style_profile (student_id, auditory_score, voice_replays)
  VALUES (p_student_id, 35.33, 1)
  ON CONFLICT (student_id) DO UPDATE SET
    auditory_score = LEAST(100, learning_style_profile.auditory_score + 2.0),
    voice_replays = learning_style_profile.voice_replays + 1,
    updated_at = now();
END;
$$;

-- Increment text score based on reading time
CREATE OR REPLACE FUNCTION increment_text_score(
  p_student_id UUID,
  p_time_seconds INTEGER DEFAULT 10
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_increment DECIMAL(5,2);
BEGIN
  -- Calculate increment based on time (max 2 points per call)
  v_increment := LEAST(p_time_seconds * 0.05, 2.0);

  INSERT INTO learning_style_profile (student_id, text_score, text_read_time_seconds)
  VALUES (p_student_id, 33.33 + v_increment, p_time_seconds)
  ON CONFLICT (student_id) DO UPDATE SET
    text_score = LEAST(100, learning_style_profile.text_score + v_increment),
    text_read_time_seconds = learning_style_profile.text_read_time_seconds + p_time_seconds,
    updated_at = now();
END;
$$;

-- =====================================================
-- Helper Function for Teacher Dashboard
-- =====================================================

-- Get all student progress for a teacher's enrolled students
CREATE OR REPLACE FUNCTION get_teacher_student_progress(p_teacher_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  class_name TEXT,
  total_topics_started INTEGER,
  total_topics_mastered INTEGER,
  average_mastery DECIMAL(5,2),
  last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.user_id AS student_id,
    sp.name AS student_name,
    c.name AS class_name,
    COUNT(sks.id)::INTEGER AS total_topics_started,
    COUNT(CASE WHEN sks.status = 'mastered' THEN 1 END)::INTEGER AS total_topics_mastered,
    COALESCE(AVG(sks.mastery_score), 0)::DECIMAL(5,2) AS average_mastery,
    MAX(sks.updated_at) AS last_activity
  FROM enrollments e
  JOIN classes c ON e.class_id = c.id
  JOIN student_profiles sp ON e.student_id = sp.user_id
  LEFT JOIN student_knowledge_state sks ON e.student_id = sks.student_id
  WHERE c.teacher_id = p_teacher_id
  GROUP BY sp.user_id, sp.name, c.name
  ORDER BY sp.name;
END;
$$;

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';
