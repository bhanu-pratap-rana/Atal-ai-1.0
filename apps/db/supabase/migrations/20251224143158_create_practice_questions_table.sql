-- =====================================================
-- Migration: Create Practice Questions Table
-- =====================================================
-- Practice questions for formative assessment in lesson pages
-- =====================================================

CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'as')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_practice_questions_topic ON practice_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_module ON practice_questions(module_id);

-- Enable RLS
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read practice questions
CREATE POLICY "practice_questions_select_authenticated" ON practice_questions
  FOR SELECT TO authenticated
  USING (true);

-- Allow anonymous users to read as well (for preview)
CREATE POLICY "practice_questions_select_anon" ON practice_questions
  FOR SELECT TO anon
  USING (true);

COMMENT ON TABLE practice_questions IS 'Practice questions for formative assessment during lessons';;
