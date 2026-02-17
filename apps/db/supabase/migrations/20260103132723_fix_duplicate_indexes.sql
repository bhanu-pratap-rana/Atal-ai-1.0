-- =====================================================
-- Migration: Remove Duplicate Indexes
-- =====================================================
-- 
-- Remove duplicate indexes that serve the same purpose.
-- Keep the more descriptive names.
-- =====================================================

-- Remove duplicate indexes, keeping the more descriptive ones
DROP INDEX IF EXISTS idx_ai_interactions_student;
DROP INDEX IF EXISTS idx_points_history_student;
DROP INDEX IF EXISTS idx_knowledge_state_student;;
