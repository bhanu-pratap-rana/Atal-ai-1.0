-- =====================================================
-- Migration 041: Move pgcrypto to extensions schema
-- =====================================================
-- Purpose: Address security warning about extension in public schema
-- Extensions should be in a dedicated schema for better security isolation
-- =====================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgcrypto to extensions schema
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
-- This ensures existing functionality continues to work
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Add comment for documentation
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions - isolated from public schema for security';
;
