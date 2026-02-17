-- =====================================================
-- Migration: Consolidate Duplicate Policies
-- =====================================================
-- 
-- Remove duplicate policies that serve the same purpose
-- =====================================================

-- =====================================================
-- PART 1: badges - Remove duplicate public read policies
-- =====================================================

DROP POLICY IF EXISTS badges_public_read ON badges;
-- Keep public_read_cultural_badges as it's more descriptive

-- =====================================================
-- PART 2: practice_questions - Consolidate read policies
-- =====================================================

DROP POLICY IF EXISTS practice_questions_select_anon ON practice_questions;
DROP POLICY IF EXISTS practice_questions_select_authenticated ON practice_questions;
-- Keep public_read_practice_questions as it covers both anon and authenticated;
