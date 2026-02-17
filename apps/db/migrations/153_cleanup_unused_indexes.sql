-- Migration 153: Cleanup Unused Indexes
-- Based on Supabase advisor report (55 unused indexes identified)
--
-- STRATEGY: Conservative removal - only drop indexes that are clearly redundant
-- KEEP: Indexes for features that may see usage with scale (IRT, vector search, sync)
--
-- This migration is REVERSIBLE if needed

-- ============================================================================
-- SAFE TO DROP: Redundant or Duplicate Indexes
-- ============================================================================

-- teacher_profiles: Keep only one school index (idx_teacher_profiles_school_id is more descriptive)
DROP INDEX IF EXISTS idx_teacher_profiles_school;

-- schools: idx_schools_code may duplicate unique constraint, but keep for queries
-- Keep both for now - schools table is small

-- announcement_reads: Keep only composite or most useful
DROP INDEX IF EXISTS idx_announcement_reads_read_at;

-- class_materials: Keep teacher and type, drop timestamp-only
DROP INDEX IF EXISTS idx_materials_created;

-- class_announcements: Keep priority and teacher, drop timestamp-only
DROP INDEX IF EXISTS idx_announcements_created;

-- ============================================================================
-- KEEP: Indexes for Core Features
-- ============================================================================

-- curriculum_content: KEEP idx_curriculum_embedding_hnsw (vector similarity search)
-- curriculum_content: KEEP idx_curriculum_content_trgm (trigram text search)

-- sync_log: KEEP idx_sync_log_student and idx_sync_log_synced_at (offline sync)

-- student_knowledge_state: KEEP all - core learning feature

-- irt_item_bank: KEEP all - adaptive testing feature (may see usage with scale)

-- ============================================================================
-- DEFERRED: Review After More Usage Data
-- ============================================================================

-- The following indexes are marked as unused but may be needed:
-- - idx_classes_class_code: Lookup by class code
-- - idx_schools_code, idx_schools_district: School lookups
-- - idx_enrollments_enrolled_at: Enrollment date queries
-- - idx_generated_lessons_student: Student lesson history
-- - idx_student_badges_*: Badge display queries
-- - idx_usernames_*: Username validation
-- - idx_feature_flags_enabled: Feature flag queries
-- - idx_practice_questions_module: Question retrieval

-- These should be reviewed after 30+ days of production usage

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON SCHEMA public IS 'Migration 153: Removed 4 clearly redundant indexes.
Kept indexes for: vector search, text search, sync, adaptive testing, and core features.
Remaining unused indexes should be reviewed after more production usage data.';
