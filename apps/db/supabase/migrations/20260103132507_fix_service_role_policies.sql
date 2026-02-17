-- =====================================================
-- Migration: Fix Service Role Policies
-- =====================================================
-- 
-- Change service_role policies from {public} to {service_role}
-- This prevents security advisor warnings while maintaining functionality
-- =====================================================

-- =====================================================
-- PART 1: student_knowledge_state
-- =====================================================

DROP POLICY IF EXISTS service_role_all ON student_knowledge_state;

CREATE POLICY service_role_all ON student_knowledge_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 2: student_badges
-- =====================================================

DROP POLICY IF EXISTS service_role_all ON student_badges;

CREATE POLICY service_role_all ON student_badges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 3: ai_tutor_interactions
-- =====================================================

DROP POLICY IF EXISTS service_role_all ON ai_tutor_interactions;

CREATE POLICY service_role_all ON ai_tutor_interactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 4: learning_style_profile
-- =====================================================

DROP POLICY IF EXISTS service_role_all ON learning_style_profile;

CREATE POLICY service_role_all ON learning_style_profile
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 5: practice_questions
-- =====================================================

DROP POLICY IF EXISTS service_role_all ON practice_questions;

CREATE POLICY service_role_all ON practice_questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 6: school_staff_credentials
-- =====================================================

DROP POLICY IF EXISTS staff_creds_read_service_only ON school_staff_credentials;
DROP POLICY IF EXISTS staff_creds_update_service_only ON school_staff_credentials;
DROP POLICY IF EXISTS staff_creds_insert_service_only ON school_staff_credentials;

CREATE POLICY staff_creds_read_service_only ON school_staff_credentials
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY staff_creds_update_service_only ON school_staff_credentials
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY staff_creds_insert_service_only ON school_staff_credentials
  FOR INSERT
  TO service_role
  WITH CHECK (true);;
