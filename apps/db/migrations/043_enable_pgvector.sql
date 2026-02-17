-- =====================================================
-- Migration 043: Enable pgvector Extension
-- =====================================================
-- Enables the pgvector extension for vector similarity search
-- Used for RAG (Retrieval Augmented Generation) in AI tutoring
--
-- Note: This must run BEFORE migration 044 which adds the
-- embedding column to curriculum_content table
-- =====================================================

-- Enable pgvector extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to curriculum_content table
-- Using 768 dimensions for Google text-embedding-004
ALTER TABLE curriculum_content
ADD COLUMN IF NOT EXISTS embedding extensions.vector(768);

-- Create HNSW index for efficient similarity search
-- Using inner product (vector_ip_ops) for normalized embeddings
CREATE INDEX IF NOT EXISTS idx_curriculum_embedding_hnsw
  ON curriculum_content
  USING hnsw (embedding extensions.vector_ip_ops)
  WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (faster to build, slightly less accurate)
-- Uncomment if HNSW is too slow to build
-- CREATE INDEX IF NOT EXISTS idx_curriculum_embedding_ivfflat
--   ON curriculum_content
--   USING ivfflat (embedding extensions.vector_cosine_ops)
--   WITH (lists = 100);

COMMENT ON COLUMN curriculum_content.embedding IS
  'Vector embedding from Google text-embedding-004 (768 dimensions) for semantic search';

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';
