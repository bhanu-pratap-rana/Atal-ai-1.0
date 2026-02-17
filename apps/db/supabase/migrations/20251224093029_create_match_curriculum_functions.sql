-- =====================================================
-- Vector Similarity Search Functions for RAG
-- =====================================================

-- Drop existing functions if they exist (for idempotency)
DROP FUNCTION IF EXISTS match_curriculum(extensions.vector(768), float, int, text, text);
DROP FUNCTION IF EXISTS match_curriculum_cosine(extensions.vector(768), float, int, text, text);
DROP FUNCTION IF EXISTS match_curriculum_hybrid(extensions.vector(768), text, float, int, text, float);
DROP FUNCTION IF EXISTS get_topic_context(text, text, int);

-- Main similarity search function using inner product (faster for normalized embeddings)
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
    (cc.embedding <#> query_embedding) * -1 AS similarity
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_language IS NULL OR cc.language = filter_language)
    AND (filter_topic IS NULL OR cc.topic_id = filter_topic)
    AND (cc.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY cc.embedding <#> query_embedding ASC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum IS
  'Performs vector similarity search on curriculum content for RAG. Uses inner product distance (faster for normalized embeddings).';

-- Alternative: Cosine Similarity Version
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

-- Hybrid Search: Combine Vector + Keyword Search
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
    COALESCE(extensions.similarity(cc.content, query_text), 0)::float AS text_similarity,
    (
      (cc.embedding <#> query_embedding) * -1 * vector_weight +
      COALESCE(extensions.similarity(cc.content, query_text), 0) * (1 - vector_weight)
    )::float AS combined_score
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_language IS NULL OR cc.language = filter_language)
    AND (
      (cc.embedding <#> query_embedding) * -1 > match_threshold
      OR extensions.similarity(cc.content, query_text) > 0.3
    )
  ORDER BY (
    (cc.embedding <#> query_embedding) * -1 * vector_weight +
    COALESCE(extensions.similarity(cc.content, query_text), 0) * (1 - vector_weight)
  ) DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum_hybrid IS
  'Hybrid search combining vector similarity and text matching. Requires pg_trgm extension.';

-- Helper: Get Curriculum Context for Topic (no vector search needed)
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
SET search_path = public
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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';;
