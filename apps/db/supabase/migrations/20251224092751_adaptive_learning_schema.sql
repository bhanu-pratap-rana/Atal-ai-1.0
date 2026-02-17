-- =====================================================
-- Migration 042: Adaptive Learning Schema
-- =====================================================
-- Creates tables for:
-- 1. Student Knowledge State (per topic mastery)
-- 2. Learning Style Profile (visual/text/auditory)
-- 3. AI Tutor Interactions (for teacher visibility)
-- 4. Formative Assessment Responses
-- 5. Summative Assessment Results
-- 6. Gamification (Badges, Points)
-- 7. Curriculum Content (for RAG)
-- =====================================================

-- Student Knowledge State (per topic)
CREATE TABLE IF NOT EXISTS student_knowledge_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  mastery_score DECIMAL(5,2) DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  confidence_level TEXT DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),
  attempts INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, module_id, topic_id)
);

-- Learning Style Profile
CREATE TABLE IF NOT EXISTS learning_style_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Tutor Interactions (for teacher visibility)
CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Formative Assessment Responses
CREATE TABLE IF NOT EXISTS formative_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  ai_hint_requested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Summative Assessment Results
CREATE TABLE IF NOT EXISTS summative_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Gamification: Badges
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
  points_value INTEGER DEFAULT 100
);

-- Student Badges (earned)
CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Points History
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curriculum Content (for RAG)
CREATE TABLE IF NOT EXISTS curriculum_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'as')),
  content_type TEXT NOT NULL CHECK (content_type IN ('definition', 'curriculum', 'example', 'exercise', 'cultural_context')),
  title TEXT,
  content TEXT NOT NULL,
  embedding extensions.vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_state_student ON student_knowledge_state(student_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_state_topic ON student_knowledge_state(topic_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_state_module ON student_knowledge_state(module_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_student ON ai_tutor_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session ON ai_tutor_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON ai_tutor_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_formative_student ON formative_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_summative_student ON summative_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_points_history_student ON points_history(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_topic ON curriculum_content(topic_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_language ON curriculum_content(language);

-- Create HNSW index for vector similarity search (faster than IVFFlat)
CREATE INDEX IF NOT EXISTS idx_curriculum_embedding_hnsw
  ON curriculum_content
  USING hnsw (embedding extensions.vector_ip_ops)
  WITH (m = 16, ef_construction = 64);

-- Create GIN index for text search
CREATE INDEX IF NOT EXISTS idx_curriculum_content_trgm
  ON curriculum_content
  USING gin (content extensions.gin_trgm_ops);;
