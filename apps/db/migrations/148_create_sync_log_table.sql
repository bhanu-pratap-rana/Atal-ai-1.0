-- Migration 148: Create sync_log table for offline sync idempotency
-- Part of Learn Page Redesign - Phase 4

-- ============================================================================
-- SYNC LOG TABLE
-- ============================================================================
-- Used to track synced items and prevent duplicate processing

CREATE TABLE IF NOT EXISTS public.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint for idempotency
    CONSTRAINT unique_idempotency_key UNIQUE (idempotency_key)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sync_log_student ON public.sync_log(student_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON public.sync_log(synced_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Students can only see their own sync log
CREATE POLICY "sync_log_student_read" ON public.sync_log
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Only service role can insert (via API)
CREATE POLICY "sync_log_service_insert" ON public.sync_log
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================
-- Automatically clean up old sync log entries (older than 30 days)

CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.sync_log
    WHERE synced_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
