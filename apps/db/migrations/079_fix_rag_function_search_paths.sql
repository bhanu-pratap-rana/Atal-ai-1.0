-- Migration 079: Fix RAG function search paths
-- Purpose: Add 'extensions' schema to search_path for match_curriculum_cosine and match_curriculum_hybrid
-- Issue: Functions were failing with "operator does not exist" because pgvector operators require extensions schema
-- Fix: Add "SET search_path = public, extensions" to both functions

-- =====================================================
-- Fix match_curriculum_cosine search path
-- =====================================================
CREATE OR REPLACE FUNCTION match_curriculum_cosine(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_language text DEFAULT NULL,
  filter_module text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  module_id text,
  topic_id text,
  language text,
  content_type text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- ✅ FIXED: Added extensions schema
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.module_id,
    cc.topic_id,
    cc.language,
    cc.content_type,
    cc.title,
    cc.content,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_language IS NULL OR cc.language = filter_language)
    AND (filter_module IS NULL OR cc.module_id = filter_module)
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum_cosine IS
  'Cosine similarity search for curriculum content. Requires pgvector extension.';

-- =====================================================
-- Fix match_curriculum_hybrid search path
-- =====================================================
CREATE OR REPLACE FUNCTION match_curriculum_hybrid(
  query_embedding extensions.vector(768),
  query_text text,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_language text DEFAULT NULL,
  vector_weight float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  module_id text,
  topic_id text,
  language text,
  content text,
  vector_similarity float,
  text_similarity float,
  combined_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- ✅ FIXED: Added extensions schema
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.module_id,
    cc.topic_id,
    cc.language,
    cc.content,
    (cc.embedding <#> query_embedding) * -1 AS vector_similarity,
    COALESCE(similarity(cc.content, query_text), 0) AS text_similarity,
    (
      (cc.embedding <#> query_embedding) * -1 * vector_weight +
      COALESCE(similarity(cc.content, query_text), 0) * (1 - vector_weight)
    ) AS combined_score
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_language IS NULL OR cc.language = filter_language)
    AND (
      (cc.embedding <#> query_embedding) * -1 > match_threshold
      OR similarity(cc.content, query_text) > 0.3
    )
  ORDER BY (
    (cc.embedding <#> query_embedding) * -1 * vector_weight +
    COALESCE(similarity(cc.content, query_text), 0) * (1 - vector_weight)
  ) DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum_hybrid IS
  'Hybrid search combining vector similarity (pgvector) and text matching (pg_trgm).';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

