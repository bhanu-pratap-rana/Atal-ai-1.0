-- =====================================================
-- Migration 152: Add match_curriculum_content_simple RPC
-- =====================================================
-- Text-based curriculum search (no embedding). Used by RAG
-- content-retrieval.retrieveRelatedContent(); code had fallback
-- (keyword textSearch) when RPC was missing. Returns content only.
-- =====================================================

CREATE OR REPLACE FUNCTION match_curriculum_content_simple(
  query_text text,
  match_count int DEFAULT 5,
  filter_language text DEFAULT NULL
)
RETURNS TABLE (content text)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  q text := trim(coalesce(query_text, ''));
BEGIN
  IF q = '' THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT cc.content
  FROM curriculum_content cc
  WHERE
    (filter_language IS NULL OR cc.language = filter_language)
    AND (
      cc.content ILIKE '%' || replace(q, ' ', '%') || '%'
      OR (plainto_tsquery('simple', q) IS NOT NULL AND cc.content @@ plainto_tsquery('simple', q))
    )
  ORDER BY
    CASE
      WHEN plainto_tsquery('simple', q) IS NOT NULL AND cc.content @@ plainto_tsquery('simple', q) THEN 0
      ELSE 1
    END,
    length(cc.content)
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_curriculum_content_simple(text, int, text) IS
  'Text-based curriculum search for RAG (no embedding). Returns content rows. RLS applies.';
