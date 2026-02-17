-- Enable pgvector extension for curriculum embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Enable pg_trgm for hybrid search (text similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;;
