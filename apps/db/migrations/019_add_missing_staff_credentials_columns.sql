-- Add missing columns to school_staff_credentials for PIN rotation tracking
-- These columns were referenced in migrate_016 but never created in the original table

-- Add updated_at column if it doesn't exist
ALTER TABLE public.school_staff_credentials
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add deleted_at column for soft deletes if it doesn't exist
ALTER TABLE public.school_staff_credentials
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_school_staff_credentials_rotated_at
ON public.school_staff_credentials(rotated_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_staff_credentials_deleted_at
ON public.school_staff_credentials(deleted_at);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.school_staff_credentials TO service_role;

-- Migration notes:
-- - updated_at: tracks when PIN was last updated
-- - deleted_at: allows soft deletes for audit trail
-- - These columns are used by rotate_staff_pin() function from migration 016
