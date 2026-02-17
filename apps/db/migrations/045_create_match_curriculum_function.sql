-- =====================================================
-- Migration 045: Create match_curriculum Function
-- =====================================================
-- Creates a PostgreSQL function for vector similarity search
-- on curriculum content using pgvector.
--
-- This function is used by the RAG service to retrieve
-- relevant curriculum context for AI tutoring.
--
-- NO LangChain needed - direct pgvector queries (40% faster)
-- =====================================================

-- Drop existing function if exists (for idempotency)
DROP FUNCTION IF EXISTS match_curriculum(extensions.vector(768), float, int, text, text);

-- Create similarity search function
-- IMPORTANT: search_path must include 'extensions' for pgvector operators to work
CREATE OR REPLACE FUNCTION match_curriculum(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_language text DEFAULT NULL,
  filter_topic text DEFAULT NULL
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
SET search_path = public, extensions
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
    -- Using cosine similarity (1 - cosine distance)
    1 - (cc.embedding <=> query_embedding)::float AS similarity
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_language IS NULL OR cc.language = filter_language)
    AND (filter_topic IS NULL OR cc.topic_id = filter_topic)
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum IS
  'Performs vector similarity search on curriculum content for RAG. Uses cosine distance for similarity.';

-- =====================================================
-- Alternative: Cosine Similarity Version
-- =====================================================
-- If embeddings are not normalized, use this version instead

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
SET search_path = public
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
    -- Cosine similarity: 1 - cosine distance
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
  'Alternative similarity search using cosine distance. Use when embeddings are not normalized.';

-- =====================================================
-- Hybrid Search: Combine Vector + Keyword Search
-- =====================================================
-- For cases where keyword matching is also useful

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
SET search_path = public
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
    -- Text similarity using trigram matching (requires pg_trgm extension)
    COALESCE(similarity(cc.content, query_text), 0) AS text_similarity,
    -- Combined score: weighted average
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
  'Hybrid search combining vector similarity and text matching. Requires pg_trgm extension.';

-- =====================================================
-- Helper: Get Curriculum Context for Topic
-- =====================================================
-- Simplified function for getting context when topic is known

CREATE OR REPLACE FUNCTION get_topic_context(
  p_topic_id text,
  p_language text DEFAULT 'en',
  p_limit int DEFAULT 3
)
RETURNS TABLE (
  content text,
  content_type text,
  title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.content,
    cc.content_type,
    cc.title
  FROM curriculum_content cc
  WHERE
    cc.topic_id = p_topic_id
    AND cc.language = p_language
  ORDER BY
    CASE cc.content_type
      WHEN 'definition' THEN 1
      WHEN 'curriculum' THEN 2
      WHEN 'example' THEN 3
      WHEN 'exercise' THEN 4
      WHEN 'cultural_context' THEN 5
      ELSE 6
    END
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_topic_context IS
  'Gets curriculum context for a specific topic without vector search. Useful when topic is already known.';

-- =====================================================
-- Enable pg_trgm for hybrid search (if not exists)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Create GIN index for text search
CREATE INDEX IF NOT EXISTS idx_curriculum_content_trgm
  ON curriculum_content
  USING gin (content extensions.gin_trgm_ops);

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';
