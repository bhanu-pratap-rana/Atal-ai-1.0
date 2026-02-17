-- Migration 128: Add Missing Composite Indexes for Performance
-- Purpose: Add composite indexes for common query patterns
-- Impact: 10-100x faster queries for assessment responses, sessions, and knowledge state

-- PART 1: Assessment Response Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_responses_session_user
  ON assessment_responses(session_id, user_id) 
  INCLUDE (is_correct);

COMMENT ON INDEX idx_assessment_responses_session_user IS
'Optimizes queries filtering assessment responses by session and user. INCLUDE (is_correct) allows index-only scans for correctness checks.';

-- PART 2: Assessment Session Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_time
  ON assessment_sessions(user_id, started_at DESC)
  WHERE submitted_at IS NOT NULL;

COMMENT ON INDEX idx_assessment_sessions_user_time IS
'Optimizes getStudentAssessmentHistory() query. Filters only submitted assessments (WHERE submitted_at IS NOT NULL) to reduce index size. Ordered by started_at DESC for efficient pagination.';

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_class_time
  ON assessment_sessions(class_id, started_at DESC)
  WHERE submitted_at IS NOT NULL;

COMMENT ON INDEX idx_assessment_sessions_class_time IS
'Optimizes class assessment queries. Filters only submitted assessments to reduce index size. Ordered by started_at DESC for efficient time-based queries.';

-- PART 3: Student Knowledge State Indexes
CREATE INDEX IF NOT EXISTS idx_student_knowledge_state_student_module
  ON student_knowledge_state(student_id, module_id)
  INCLUDE (mastery_score, status);

COMMENT ON INDEX idx_student_knowledge_state_student_module IS
'Optimizes knowledge state queries by student and module. INCLUDE (mastery_score, status) allows index-only scans.';

-- PART 4: Soft-Delete Indexes
CREATE INDEX IF NOT EXISTS idx_school_staff_credentials_active
  ON school_staff_credentials(school_id, created_at)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_school_staff_credentials_active IS
'Optimizes queries for active (non-deleted) school staff credentials. WHERE deleted_at IS NULL filters out soft-deleted records.';;
