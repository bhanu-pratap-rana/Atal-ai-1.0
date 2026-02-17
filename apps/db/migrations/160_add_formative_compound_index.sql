-- Migration 160: Add compound index for formative_responses
-- PERF-P2: Queries filter by (student_id, topic_id) together.
-- Existing idx_formative_student only covers student_id.

CREATE INDEX IF NOT EXISTS idx_formative_student_topic
  ON formative_responses(student_id, topic_id);
