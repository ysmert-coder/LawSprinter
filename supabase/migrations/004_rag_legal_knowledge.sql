-- =====================================================
-- RAG-Based Legal Knowledge System
-- LawSprinter - pgvector + Embeddings
-- =====================================================
-- This migration adds vector search capabilities for:
-- 1. Public legal documents (case law, legislation, doctrine)
-- 2. Private case-specific knowledge chunks
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- TABLE: legal_documents
-- =====================================================
-- Stores legal documents metadata (Yargıtay decisions, legislation, articles, etc.)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,                    -- e.g., 'Yargıtay', 'Kanun', 'Makale', 'Danıştay'
  doc_type TEXT NOT NULL,                  -- e.g., 'mevzuat', 'içtihat', 'doktrin'
  court TEXT,                              -- e.g., 'Yargıtay', 'Danıştay', 'Anayasa Mahkemesi'
  chamber TEXT,                            -- e.g., '12. Hukuk Dairesi', '2. Ceza Dairesi'
  decision_no TEXT,                        -- e.g., 'E. 2023/1234 K. 2023/5678'
  file_no TEXT,                            -- Esas dosya numarası
  date DATE,                               -- Decision/publication date
  url TEXT,                                -- Original source URL (e.g., Kazancı, Legalbank)
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Soft delete flag
  metadata JSONB DEFAULT '{}'::JSONB,      -- Additional flexible metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add comment
COMMENT ON TABLE public.legal_documents IS 'Legal documents metadata for RAG system (case law, legislation, doctrine)';

-- =====================================================
-- TABLE: legal_chunks
-- =====================================================
-- Stores chunked content with embeddings for vector search
CREATE TABLE IF NOT EXISTS public.legal_chunks (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,            -- Order of chunk in document (0, 1, 2, ...)
  content TEXT NOT NULL,                   -- The actual text chunk
  embedding vector(1536) NOT NULL,         -- OpenAI/DeepSeek embedding (1536 dimensions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add comment
COMMENT ON TABLE public.legal_chunks IS 'Chunked legal document content with vector embeddings for semantic search';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_chunks_document_id 
  ON public.legal_chunks(document_id);

-- IVFFlat index for fast vector similarity search (cosine distance)
-- Note: You may need to tune lists parameter based on data size
-- For < 1M rows: lists = rows / 1000
CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding 
  ON public.legal_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =====================================================
-- TABLE: private_case_chunks
-- =====================================================
-- Stores private case-specific knowledge chunks (uploaded files, notes, etc.)
-- This is user/firm-specific and isolated via RLS
CREATE TABLE IF NOT EXISTS public.private_case_chunks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                    -- e.g., 'uploaded_file', 'note', 'email', 'transcript'
  content TEXT NOT NULL,                   -- The actual text chunk
  embedding vector(1536) NOT NULL,         -- OpenAI/DeepSeek embedding (1536 dimensions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add comment
COMMENT ON TABLE public.private_case_chunks IS 'Private case-specific knowledge chunks with embeddings (user-uploaded content)';

-- Composite index for user + case queries
CREATE INDEX IF NOT EXISTS idx_private_case_chunks_user_case 
  ON public.private_case_chunks(user_id, case_id);

-- IVFFlat index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_private_case_chunks_embedding 
  ON public.private_case_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_case_chunks ENABLE ROW LEVEL SECURITY;

-- Legal Documents: Public read access (all authenticated users)
CREATE POLICY "Authenticated users can view active legal documents"
  ON public.legal_documents FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Legal Documents: Only admins can insert/update (for now, allow all authenticated users)
-- TODO: Restrict to admin role in production
CREATE POLICY "Authenticated users can insert legal documents"
  ON public.legal_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update legal documents"
  ON public.legal_documents FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Legal Chunks: Public read access (all authenticated users)
CREATE POLICY "Authenticated users can view legal chunks"
  ON public.legal_chunks FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.legal_documents 
      WHERE id = legal_chunks.document_id 
      AND is_active = TRUE
    )
  );

CREATE POLICY "Authenticated users can insert legal chunks"
  ON public.legal_chunks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Private Case Chunks: Users can only access their own firm's case chunks
CREATE POLICY "Users can view own firm case chunks"
  ON public.private_case_chunks FOR SELECT
  USING (
    user_id = auth.uid()
    OR case_id IN (
      SELECT c.id FROM public.cases c
      INNER JOIN public.profiles p ON p.firm_id = c.firm_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own case chunks"
  ON public.private_case_chunks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND case_id IN (
      SELECT c.id FROM public.cases c
      INNER JOIN public.profiles p ON p.firm_id = c.firm_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own case chunks"
  ON public.private_case_chunks FOR DELETE
  USING (
    user_id = auth.uid()
    OR case_id IN (
      SELECT c.id FROM public.cases c
      INNER JOIN public.profiles p ON p.firm_id = c.firm_id
      WHERE p.id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Trigger to update updated_at on legal_documents
CREATE TRIGGER set_updated_at_legal_documents 
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- HELPER FUNCTIONS FOR VECTOR SEARCH
-- =====================================================

-- Function: Search legal documents by semantic similarity
-- Usage: SELECT * FROM search_legal_documents('[0.1, 0.2, ...]'::vector, 10);
CREATE OR REPLACE FUNCTION public.search_legal_documents(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  doc_type_filter TEXT DEFAULT NULL,
  court_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  chunk_id BIGINT,
  title TEXT,
  source TEXT,
  doc_type TEXT,
  court TEXT,
  chamber TEXT,
  decision_no TEXT,
  date DATE,
  url TEXT,
  content TEXT,
  similarity FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ld.id AS document_id,
    lc.id AS chunk_id,
    ld.title,
    ld.source,
    ld.doc_type,
    ld.court,
    ld.chamber,
    ld.decision_no,
    ld.date,
    ld.url,
    lc.content,
    1 - (lc.embedding <=> query_embedding) AS similarity
  FROM public.legal_chunks lc
  INNER JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE 
    ld.is_active = TRUE
    AND (doc_type_filter IS NULL OR ld.doc_type = doc_type_filter)
    AND (court_filter IS NULL OR ld.court = court_filter)
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.search_legal_documents IS 'Semantic search for legal documents using vector similarity (cosine distance)';

-- Function: Search private case chunks by semantic similarity
-- Usage: SELECT * FROM search_private_case_chunks('user-id', 'case-id', '[0.1, 0.2, ...]'::vector, 5);
CREATE OR REPLACE FUNCTION public.search_private_case_chunks(
  p_user_id UUID,
  p_case_id UUID,
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_id BIGINT,
  source TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcc.id AS chunk_id,
    pcc.source,
    pcc.content,
    1 - (pcc.embedding <=> query_embedding) AS similarity,
    pcc.created_at
  FROM public.private_case_chunks pcc
  WHERE 
    pcc.case_id = p_case_id
    AND (
      pcc.user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM public.cases c
        INNER JOIN public.profiles p ON p.firm_id = c.firm_id
        WHERE c.id = pcc.case_id AND p.id = p_user_id
      )
    )
  ORDER BY pcc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.search_private_case_chunks IS 'Semantic search for private case-specific chunks using vector similarity';

-- =====================================================
-- INDEXES FOR METADATA QUERIES
-- =====================================================

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_legal_documents_doc_type 
  ON public.legal_documents(doc_type) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_legal_documents_court 
  ON public.legal_documents(court) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_legal_documents_date 
  ON public.legal_documents(date DESC) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_legal_documents_source 
  ON public.legal_documents(source) WHERE is_active = TRUE;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample legal document
/*
INSERT INTO public.legal_documents (
  title, 
  source, 
  doc_type, 
  court, 
  chamber, 
  decision_no, 
  date,
  url,
  metadata
) VALUES (
  'İşçi Alacağı - Kıdem Tazminatı Hesaplaması',
  'Yargıtay',
  'içtihat',
  'Yargıtay',
  '9. Hukuk Dairesi',
  'E. 2023/1234 K. 2023/5678',
  '2023-06-15',
  'https://example.com/yargi-karari',
  '{"keywords": ["kıdem tazminatı", "işçi alacağı", "iş hukuku"]}'::jsonb
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary:
-- ✅ pgvector extension enabled
-- ✅ legal_documents table created (metadata)
-- ✅ legal_chunks table created (embeddings)
-- ✅ private_case_chunks table created (user-specific)
-- ✅ Indexes created for performance
-- ✅ RLS policies configured
-- ✅ Helper functions for semantic search
-- ✅ Ready for n8n integration


