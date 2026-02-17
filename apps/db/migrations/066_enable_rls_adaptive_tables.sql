-- =====================================================
-- Migration 066: Enable RLS on Adaptive Learning Tables
-- =====================================================
--
-- Enables Row-Level Security on 6 tables for the adaptive
-- learning system (learning_paths deferred to future implementation).
-- Ensures students can only access their own data, teachers can see
-- enrolled students' data, and admins can see everything.
--
-- Tables affected:
-- 1. student_knowledge_state
-- 2. learning_paths (deferred - IF EXISTS ensures no error)
-- 3. student_badges
-- 4. ai_tutor_interactions
-- 5. practice_questions
-- 6. learning_style_profile
-- 7. badges (cultural badge definitions)
--
-- Security principles:
-- - Students: View/Edit own data only
-- - Teachers: View enrolled students' data
-- - Admins: View all data
-- - Service role (functions): Full access
--
-- =====================================================

-- =====================================================
-- PART 1: student_knowledge_state
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS student_knowledge_state ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS students_own_knowledge_select ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_insert ON student_knowledge_state;
DROP POLICY IF EXISTS students_own_knowledge_update ON student_knowledge_state;
DROP POLICY IF EXISTS teachers_view_student_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS admin_view_all_knowledge ON student_knowledge_state;
DROP POLICY IF EXISTS service_role_all ON student_knowledge_state;

-- Students can view their own knowledge state
CREATE POLICY students_own_knowledge_select ON student_knowledge_state
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own knowledge state
CREATE POLICY students_own_knowledge_insert ON student_knowledge_state
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own knowledge state
CREATE POLICY students_own_knowledge_update ON student_knowledge_state
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view knowledge state of students in their classes
CREATE POLICY teachers_view_student_knowledge ON student_knowledge_state
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all knowledge states
CREATE POLICY admin_view_all_knowledge ON student_knowledge_state
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role (functions) can do everything
CREATE POLICY service_role_all ON student_knowledge_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 2: learning_paths
-- =====================================================

-- Enable RLS
ALTER TABLE IF EXISTS learning_paths ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS students_own_learning_paths_select ON learning_paths;
DROP POLICY IF EXISTS students_own_learning_paths_insert ON learning_paths;
DROP POLICY IF EXISTS students_own_learning_paths_update ON learning_paths;
DROP POLICY IF EXISTS teachers_view_student_paths ON learning_paths;
DROP POLICY IF EXISTS admin_view_all_paths ON learning_paths;
DROP POLICY IF EXISTS service_role_all ON learning_paths;

-- Students can view their own learning paths
CREATE POLICY students_own_learning_paths_select ON learning_paths
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own learning paths
CREATE POLICY students_own_learning_paths_insert ON learning_paths
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own learning paths
CREATE POLICY students_own_learning_paths_update ON learning_paths
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view learning paths of students in their classes
CREATE POLICY teachers_view_student_paths ON learning_paths
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_paths.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all learning paths
CREATE POLICY admin_view_all_paths ON learning_paths
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role can do everything
CREATE POLICY service_role_all ON learning_paths
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 3: student_badges
-- =====================================================

-- Enable RLS
ALTER TABLE IF EXISTS student_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS students_own_badges_select ON student_badges;
DROP POLICY IF EXISTS students_own_badges_insert ON student_badges;
DROP POLICY IF EXISTS teachers_view_student_badges ON student_badges;
DROP POLICY IF EXISTS admin_view_all_badges ON student_badges;
DROP POLICY IF EXISTS service_role_all ON student_badges;

-- Students can view their own badges
CREATE POLICY students_own_badges_select ON student_badges
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own badges (system managed)
CREATE POLICY students_own_badges_insert ON student_badges
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view badges of students in their classes
CREATE POLICY teachers_view_student_badges ON student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all student badges
CREATE POLICY admin_view_all_badges ON student_badges
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role can do everything (for gamification service)
CREATE POLICY service_role_all ON student_badges
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 4: ai_tutor_interactions
-- =====================================================

-- Enable RLS (SENSITIVE: contains chat logs)
ALTER TABLE IF EXISTS ai_tutor_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS students_own_interactions_select ON ai_tutor_interactions;
DROP POLICY IF EXISTS students_own_interactions_insert ON ai_tutor_interactions;
DROP POLICY IF EXISTS teachers_view_student_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS admin_view_all_interactions ON ai_tutor_interactions;
DROP POLICY IF EXISTS service_role_all ON ai_tutor_interactions;

-- Students can view their own tutor interactions
CREATE POLICY students_own_interactions_select ON ai_tutor_interactions
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own tutor interactions
CREATE POLICY students_own_interactions_insert ON ai_tutor_interactions
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view tutor interactions of students in their classes
CREATE POLICY teachers_view_student_interactions ON ai_tutor_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ai_tutor_interactions.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all tutor interactions
CREATE POLICY admin_view_all_interactions ON ai_tutor_interactions
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role can do everything (for AI tutor service)
CREATE POLICY service_role_all ON ai_tutor_interactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 5: practice_questions
-- =====================================================

-- Enable RLS
ALTER TABLE IF EXISTS practice_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS students_own_practice_select ON practice_questions;
DROP POLICY IF EXISTS students_own_practice_insert ON practice_questions;
DROP POLICY IF EXISTS students_own_practice_update ON practice_questions;
DROP POLICY IF EXISTS teachers_view_student_practice ON practice_questions;
DROP POLICY IF EXISTS admin_view_all_practice ON practice_questions;
DROP POLICY IF EXISTS service_role_all ON practice_questions;

-- Students can view their own practice questions
CREATE POLICY students_own_practice_select ON practice_questions
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own practice responses
CREATE POLICY students_own_practice_insert ON practice_questions
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own practice responses
CREATE POLICY students_own_practice_update ON practice_questions
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view practice questions of students in their classes
CREATE POLICY teachers_view_student_practice ON practice_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = practice_questions.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all practice questions
CREATE POLICY admin_view_all_practice ON practice_questions
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role can do everything
CREATE POLICY service_role_all ON practice_questions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 6: learning_style_profile
-- =====================================================

-- Enable RLS
ALTER TABLE IF EXISTS learning_style_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS students_own_profile_select ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_insert ON learning_style_profile;
DROP POLICY IF EXISTS students_own_profile_update ON learning_style_profile;
DROP POLICY IF EXISTS teachers_view_student_profile ON learning_style_profile;
DROP POLICY IF EXISTS admin_view_all_profiles ON learning_style_profile;
DROP POLICY IF EXISTS service_role_all ON learning_style_profile;

-- Students can view their own learning style profile
CREATE POLICY students_own_profile_select ON learning_style_profile
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

-- Students can insert their own learning style profile
CREATE POLICY students_own_profile_insert ON learning_style_profile
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Students can update their own learning style profile
CREATE POLICY students_own_profile_update ON learning_style_profile
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

-- Teachers can view learning style of students in their classes
CREATE POLICY teachers_view_student_profile ON learning_style_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = learning_style_profile.student_id
      AND c.teacher_id = (SELECT auth.uid())
    )
  );

-- Admins can view all learning style profiles
CREATE POLICY admin_view_all_profiles ON learning_style_profile
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Service role can do everything
CREATE POLICY service_role_all ON learning_style_profile
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 7: badges (Cultural Badge Definitions - READ-ONLY)
-- =====================================================

-- Enable RLS (public read-only)
ALTER TABLE IF EXISTS badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS public_read_cultural_badges ON badges;
DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;

-- Everyone can view badge definitions
CREATE POLICY public_read_cultural_badges ON badges
  FOR SELECT
  USING (true);

-- Only admins can modify badge definitions
CREATE POLICY admin_manage_cultural_badges ON badges
  FOR ALL
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- =====================================================
-- Verification
-- =====================================================

-- Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'student_knowledge_state',
  'learning_paths',
  'student_badges',
  'ai_tutor_interactions',
  'practice_questions',
  'learning_style_profile',
  'badges'
)
ORDER BY tablename;
