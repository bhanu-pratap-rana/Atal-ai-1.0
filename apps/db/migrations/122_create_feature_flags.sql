-- Migration 122: Create Feature Flags System
-- Purpose: Enable safe gradual rollouts, A/B testing, and emergency kill switches

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  whitelist_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Add RLS policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for client-side checks)
CREATE POLICY feature_flags_read_all ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify feature flags
CREATE POLICY feature_flags_admin_manage ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );

-- Seed default flags
INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage) VALUES
  ('voice_ai_tutor', 'Voice AI Tutor', 'Enable voice input/output in AI tutor', false, 10),
  ('badge_automation', 'Badge Automation', 'Auto-award badges on milestones', true, 100),
  ('adaptive_learning', 'Adaptive Learning', 'Personalized content delivery', true, 100),
  ('teacher_assessment_creation', 'Teacher Assessment Creation', 'Teachers can create custom assessments', false, 0),
  ('offline_sync', 'Offline Sync', 'Enable offline-first capabilities with IndexedDB', true, 100)
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE feature_flags IS 'Feature flags for safe gradual rollouts and A/B testing';

