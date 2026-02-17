-- =====================================================
-- Migration 139: Fix Supabase Advisor Warnings (Jan 2026)
-- =====================================================
--
-- Fixes:
-- 1. function_search_path_mutable - Add SET search_path to trigger functions
-- 2. auth_rls_initplan - Optimize RLS policies with (select auth.uid())
-- 3. multiple_permissive_policies - Consolidate overlapping SELECT policies
-- 4. unused_index - Remove unused embedding index
--
-- =====================================================

-- =====================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE
-- =====================================================

-- Fix update_announcement_updated_at
CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_material_updated_at
CREATE OR REPLACE FUNCTION update_material_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. FIX RLS INITPLAN PERFORMANCE
-- Replace auth.uid() with (select auth.uid()) for better query planning
-- =====================================================

-- Drop and recreate class_announcements policies
DROP POLICY IF EXISTS "teachers_manage_own_announcements" ON class_announcements;
DROP POLICY IF EXISTS "students_read_class_announcements" ON class_announcements;

CREATE POLICY "teachers_manage_own_announcements"
  ON class_announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

CREATE POLICY "students_read_class_announcements"
  ON class_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_announcements.class_id
      AND e.student_id = (select auth.uid())
    )
  );

-- Drop and recreate announcement_reads policies
DROP POLICY IF EXISTS "students_insert_own_reads" ON announcement_reads;
DROP POLICY IF EXISTS "students_read_own_reads" ON announcement_reads;
DROP POLICY IF EXISTS "teachers_read_class_reads" ON announcement_reads;

CREATE POLICY "students_insert_own_reads"
  ON announcement_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM class_announcements a
      JOIN enrollments e ON e.class_id = a.class_id
      WHERE a.id = announcement_reads.announcement_id
      AND e.student_id = (select auth.uid())
    )
  );

-- Consolidated SELECT policy for announcement_reads
-- Combines students_read_own_reads and teachers_read_class_reads
CREATE POLICY "announcement_reads_select"
  ON announcement_reads
  FOR SELECT
  TO authenticated
  USING (
    -- Students see their own reads
    student_id = (select auth.uid())
    OR
    -- Teachers see reads for their class announcements
    EXISTS (
      SELECT 1 FROM class_announcements a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = announcement_reads.announcement_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Drop and recreate class_materials policies
DROP POLICY IF EXISTS "teachers_manage_own_materials" ON class_materials;
DROP POLICY IF EXISTS "students_read_class_materials" ON class_materials;

CREATE POLICY "teachers_manage_own_materials"
  ON class_materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

CREATE POLICY "students_read_class_materials"
  ON class_materials
  FOR SELECT
  TO authenticated
  USING (
    is_visible = true AND
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_materials.class_id
      AND e.student_id = (select auth.uid())
    )
  );

-- =====================================================
-- Fix remaining auth_rls_initplan warnings
-- These policies were created in earlier migrations
-- =====================================================

-- Fix irt_item_bank_authenticated_select
DROP POLICY IF EXISTS "irt_item_bank_authenticated_select" ON irt_item_bank;
CREATE POLICY "irt_item_bank_authenticated_select"
  ON irt_item_bank
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Fix student_knowledge_state_authenticated_select
DROP POLICY IF EXISTS "student_knowledge_state_authenticated_select" ON student_knowledge_state;
CREATE POLICY "student_knowledge_state_authenticated_select"
  ON student_knowledge_state
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM classes c
      JOIN enrollments e ON e.class_id = c.id
      WHERE e.student_id = student_knowledge_state.student_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Fix learning_style_profile_authenticated_select
DROP POLICY IF EXISTS "learning_style_profile_authenticated_select" ON learning_style_profile;
CREATE POLICY "learning_style_profile_authenticated_select"
  ON learning_style_profile
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- Fix ai_tutor_interactions_authenticated_select
DROP POLICY IF EXISTS "ai_tutor_interactions_authenticated_select" ON ai_tutor_interactions;
CREATE POLICY "ai_tutor_interactions_authenticated_select"
  ON ai_tutor_interactions
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- Fix badges admin policies
DROP POLICY IF EXISTS "badges_admin_delete" ON badges;
DROP POLICY IF EXISTS "badges_admin_insert" ON badges;
DROP POLICY IF EXISTS "badges_admin_update" ON badges;

CREATE POLICY "badges_admin_delete"
  ON badges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "badges_admin_insert"
  ON badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "badges_admin_update"
  ON badges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

-- Fix student_badges_authenticated_select
DROP POLICY IF EXISTS "student_badges_authenticated_select" ON student_badges;
CREATE POLICY "student_badges_authenticated_select"
  ON student_badges
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM classes c
      JOIN enrollments e ON e.class_id = c.id
      WHERE e.student_id = student_badges.student_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Fix practice_questions admin policies
DROP POLICY IF EXISTS "practice_questions_admin_delete" ON practice_questions;
DROP POLICY IF EXISTS "practice_questions_admin_insert" ON practice_questions;
DROP POLICY IF EXISTS "practice_questions_admin_update" ON practice_questions;

CREATE POLICY "practice_questions_admin_delete"
  ON practice_questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "practice_questions_admin_insert"
  ON practice_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "practice_questions_admin_update"
  ON practice_questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

-- Fix feature_flags admin policies
DROP POLICY IF EXISTS "feature_flags_admin_delete" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_admin_insert" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_admin_update" ON feature_flags;

CREATE POLICY "feature_flags_admin_delete"
  ON feature_flags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "feature_flags_admin_insert"
  ON feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "feature_flags_admin_update"
  ON feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'admin'
    )
  );

-- =====================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================
--
-- The announcement_reads SELECT policies were consolidated above
-- into a single "announcement_reads_select" policy.
--
-- Note: modules table policies (modules_public_read, modules_service_role_all)
-- are intentionally separate - one allows public read access for curriculum,
-- the other allows service role to modify data. These don't need consolidation
-- as they serve different purposes and don't cause performance issues.

-- =====================================================
-- 4. DROP UNUSED INDEX
-- =====================================================

-- Drop unused embedding index (if exists)
DROP INDEX IF EXISTS idx_curriculum_content_embedding;

-- =====================================================
-- RELOAD SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON FUNCTION update_announcement_updated_at IS 'Trigger function to update updated_at timestamp on class_announcements';
COMMENT ON FUNCTION update_material_updated_at IS 'Trigger function to update updated_at timestamp on class_materials';;
