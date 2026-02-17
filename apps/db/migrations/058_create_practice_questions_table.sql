-- =====================================================
-- Migration 058: Create practice_questions table
-- =====================================================
--
-- Adds missing schema definition for existing table with 450 rows
-- This table was created manually or dropped from migrations,
-- and needs proper migration tracking for reproducibility
--
-- Table Purpose:
-- Stores practice questions for students across 5 modules
-- in 3 languages (English, Hindi, Assamese)
--
-- =====================================================

CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'as')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_practice_topic ON practice_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_module ON practice_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_practice_language ON practice_questions(language);

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON TABLE practice_questions IS 'Practice questions for students across 5 modules in 3 languages (en, hi, as)';
COMMENT ON COLUMN practice_questions.id IS 'Unique identifier for practice question';
COMMENT ON COLUMN practice_questions.topic_id IS 'Reference to topic within module';
COMMENT ON COLUMN practice_questions.module_id IS 'Reference to learning module';
COMMENT ON COLUMN practice_questions.language IS 'Language of question (en=English, hi=Hindi, as=Assamese)';
COMMENT ON COLUMN practice_questions.question IS 'Question text in specified language';
COMMENT ON COLUMN practice_questions.options IS 'JSON array of answer options';
COMMENT ON COLUMN practice_questions.correct_index IS 'Index of correct answer in options array (0-based)';
COMMENT ON COLUMN practice_questions.explanation IS 'Explanation for correct answer';
COMMENT ON COLUMN practice_questions.order_index IS 'Display order of question within topic';
COMMENT ON COLUMN practice_questions.student_id IS 'Optional: Student who answered this question (for tracking)';
COMMENT ON COLUMN practice_questions.created_at IS 'Timestamp when question was created';
COMMENT ON COLUMN practice_questions.updated_at IS 'Timestamp when question was last modified';
