-- =====================================================
-- RAG (Retrieval-Augmented Generation) System
-- =====================================================
-- Purpose: Store and search legal documents with vector embeddings
-- Public docs: Yargıtay kararları, mevzuat, doktrin (shared across all users)
-- Private docs: User-specific case documents (RLS protected)

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- PUBLIC DOCUMENTS
-- =====================================================

-- Public legal documents (case law, statutes, doctrine)
CREATE TABLE IF NOT EXISTS public.rag_public_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'mevzuat', 'ictihat', 'doktrin', etc.
  court TEXT, -- Yargıtay 9. HD, etc.
  date DATE, -- Decision/publication date
  url TEXT, -- Link to source
  raw_text TEXT NOT NULL, -- Full document text
  metadata JSONB DEFAULT '{}', -- Additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunks from public documents with embeddings
CREATE TABLE IF NOT EXISTS public.rag_public_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID NOT NULL REFERENCES public.rag_public_docs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doc_id, chunk_index)
);

-- =====================================================
-- PRIVATE DOCUMENTS
-- =====================================================

-- Private user documents (case-specific)
CREATE TABLE IF NOT EXISTS public.rag_private_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunks from private documents with embeddings
CREATE TABLE IF NOT EXISTS public.rag_private_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID NOT NULL REFERENCES public.rag_private_docs(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doc_id, chunk_index)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Public docs indexes
CREATE INDEX IF NOT EXISTS idx_rag_public_docs_doc_type ON public.rag_public_docs(doc_type);
CREATE INDEX IF NOT EXISTS idx_rag_public_docs_court ON public.rag_public_docs(court);
CREATE INDEX IF NOT EXISTS idx_rag_public_docs_date ON public.rag_public_docs(date DESC);

-- Public chunks indexes
CREATE INDEX IF NOT EXISTS idx_rag_public_chunks_doc_id ON public.rag_public_chunks(doc_id);
-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_rag_public_chunks_embedding ON public.rag_public_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Private docs indexes
CREATE INDEX IF NOT EXISTS idx_rag_private_docs_firm_id ON public.rag_private_docs(firm_id);
CREATE INDEX IF NOT EXISTS idx_rag_private_docs_case_id ON public.rag_private_docs(case_id);

-- Private chunks indexes
CREATE INDEX IF NOT EXISTS idx_rag_private_chunks_doc_id ON public.rag_private_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_rag_private_chunks_firm_id ON public.rag_private_chunks(firm_id);
-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_rag_private_chunks_embedding ON public.rag_private_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Public docs: Everyone can read
ALTER TABLE public.rag_public_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public docs are viewable by everyone" 
  ON public.rag_public_docs FOR SELECT 
  USING (true);

-- Public chunks: Everyone can read
ALTER TABLE public.rag_public_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public chunks are viewable by everyone" 
  ON public.rag_public_chunks FOR SELECT 
  USING (true);

-- Private docs: Only same firm can access
ALTER TABLE public.rag_private_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own firm's private docs" 
  ON public.rag_private_docs FOR SELECT 
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Private chunks: Only same firm can access
ALTER TABLE public.rag_private_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own firm's private chunks" 
  ON public.rag_private_chunks FOR SELECT 
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to search public chunks by vector similarity
CREATE OR REPLACE FUNCTION search_public_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  doc_id uuid,
  chunk_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.doc_id,
    c.id as chunk_id,
    c.chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM public.rag_public_chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search private chunks by vector similarity (with firm_id filter)
CREATE OR REPLACE FUNCTION search_private_chunks(
  query_embedding vector(1536),
  user_firm_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  doc_id uuid,
  chunk_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.doc_id,
    c.id as chunk_id,
    c.chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM public.rag_private_chunks c
  WHERE c.firm_id = user_firm_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at for public docs
CREATE OR REPLACE FUNCTION update_rag_public_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rag_public_docs_updated_at
  BEFORE UPDATE ON public.rag_public_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_rag_public_docs_updated_at();

-- Auto-update updated_at for private docs
CREATE OR REPLACE FUNCTION update_rag_private_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rag_private_docs_updated_at
  BEFORE UPDATE ON public.rag_private_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_rag_private_docs_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.rag_public_docs IS 'Public legal documents (case law, statutes, doctrine) shared across all users';
COMMENT ON TABLE public.rag_public_chunks IS 'Text chunks with embeddings from public documents for vector search';
COMMENT ON TABLE public.rag_private_docs IS 'Private user/case-specific documents (RLS protected)';
COMMENT ON TABLE public.rag_private_chunks IS 'Text chunks with embeddings from private documents (RLS protected)';

COMMENT ON COLUMN public.rag_public_docs.doc_type IS 'Document type: mevzuat (statute), ictihat (case law), doktrin (doctrine)';
COMMENT ON COLUMN public.rag_public_docs.court IS 'Court name for case law (e.g., Yargıtay 9. HD)';
COMMENT ON COLUMN public.rag_public_chunks.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';
COMMENT ON COLUMN public.rag_private_chunks.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';

