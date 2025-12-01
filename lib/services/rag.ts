/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Handles vector embeddings and semantic search for legal documents
 * - Public docs: Yargıtay kararları, mevzuat, doktrin (shared)
 * - Private docs: User-specific case documents (RLS protected)
 */

import { createClient } from '@/src/lib/supabaseServer'
import { callN8NWebhook } from '@/lib/n8n'

// =====================================================
// TYPES
// =====================================================

export type DocType = 'mevzuat' | 'ictihat' | 'doktrin' | string

export interface ImportPublicDocParams {
  title: string
  docType: DocType
  court?: string | null
  date?: string | null // ISO date string
  url?: string | null
  rawText: string
}

export interface EmbeddingChunk {
  chunk_index: number
  chunk_text: string
  embedding: number[] // Vector array
}

export interface EmbeddingsResponse {
  chunks: EmbeddingChunk[]
}

export interface SearchHybridRagParams {
  userId: string
  query: string
  limit?: number
}

export interface PublicChunkResult {
  docId: string
  title: string | null
  docType: string | null
  court: string | null
  date: string | null
  url: string | null
  chunkText: string
  similarity: number
}

export interface PrivateChunkResult {
  docId: string
  title: string | null
  caseId: string | null
  chunkText: string
  similarity: number
}

export interface HybridSearchResult {
  publicChunks: PublicChunkResult[]
  privateChunks: PrivateChunkResult[]
}

/**
 * RAG Source for API responses
 * Unified format for both public and private sources
 */
export type RagSource = {
  id: string
  title?: string | null
  docType?: string | null
  court?: string | null
  url?: string | null
  similarity?: number
  scope: 'public' | 'private'
  snippet: string
}

// =====================================================
// IMPORT PUBLIC DOCUMENT
// =====================================================

/**
 * Import a public legal document with automatic embedding generation
 * 
 * @param params Document metadata and text
 * @returns Document ID
 */
export async function importPublicDoc(
  params: ImportPublicDocParams
): Promise<{ docId: string }> {
  const { title, docType, court, date, url, rawText } = params

  if (!rawText || !rawText.trim()) {
    throw new Error('rawText is required and cannot be empty')
  }

  if (!title || !title.trim()) {
    throw new Error('title is required and cannot be empty')
  }

  try {
    const supabase = await createClient()

    // 1. Insert document into rag_public_docs
    const { data: docData, error: docError } = await supabase
      .from('rag_public_docs')
      .insert({
        title: title.trim(),
        doc_type: docType,
        court: court || null,
        date: date || null,
        url: url || null,
        raw_text: rawText.trim(),
      })
      .select('id')
      .single()

    if (docError || !docData) {
      console.error('[importPublicDoc] Error inserting document:', docError)
      throw new Error('Failed to insert document: ' + (docError?.message || 'Unknown error'))
    }

    const docId = docData.id

    console.log('[importPublicDoc] Document inserted:', docId)

    // 2. Generate embeddings via n8n webhook
    console.log('[importPublicDoc] Generating embeddings for doc:', docId)

    const embeddingsResponse = await callN8NWebhook<EmbeddingsResponse>('EMBEDDINGS', {
      text: rawText.trim(),
      docId: docId,
      scope: 'public',
    })

    if (!embeddingsResponse.chunks || embeddingsResponse.chunks.length === 0) {
      console.error('[importPublicDoc] No chunks returned from embeddings webhook')
      // Delete the document since we couldn't generate embeddings
      await supabase.from('rag_public_docs').delete().eq('id', docId)
      throw new Error('Failed to generate embeddings: No chunks returned')
    }

    console.log('[importPublicDoc] Received', embeddingsResponse.chunks.length, 'chunks')

    // 3. Insert chunks into rag_public_chunks
    const chunksToInsert = embeddingsResponse.chunks.map((chunk) => ({
      doc_id: docId,
      chunk_index: chunk.chunk_index,
      chunk_text: chunk.chunk_text,
      embedding: JSON.stringify(chunk.embedding), // pgvector expects string representation
    }))

    const { error: chunksError } = await supabase
      .from('rag_public_chunks')
      .insert(chunksToInsert)

    if (chunksError) {
      console.error('[importPublicDoc] Error inserting chunks:', chunksError)
      // Rollback: delete the document (cascade will delete any chunks)
      await supabase.from('rag_public_docs').delete().eq('id', docId)
      throw new Error('Failed to insert chunks: ' + chunksError.message)
    }

    console.log('[importPublicDoc] Successfully imported document with', chunksToInsert.length, 'chunks')

    return { docId }
  } catch (error: any) {
    console.error('[importPublicDoc] Error:', error)
    throw new Error(error.message || 'Failed to import public document')
  }
}

// =====================================================
// HYBRID RAG SEARCH
// =====================================================

/**
 * Perform hybrid semantic search across public and private documents
 * 
 * @param params Search parameters
 * @returns Public and private chunks with similarity scores
 */
export async function searchHybridRag(
  params: SearchHybridRagParams
): Promise<HybridSearchResult> {
  const { userId, query, limit = 10 } = params

  if (!query || !query.trim()) {
    throw new Error('query is required and cannot be empty')
  }

  try {
    const supabase = await createClient()

    // 1. Generate query embedding via n8n webhook
    console.log('[searchHybridRag] Generating query embedding')

    const embeddingsResponse = await callN8NWebhook<EmbeddingsResponse>('EMBEDDINGS', {
      text: query.trim(),
      docId: null,
      scope: 'query',
    })

    if (!embeddingsResponse.chunks || embeddingsResponse.chunks.length === 0) {
      console.error('[searchHybridRag] No embedding returned for query')
      throw new Error('Failed to generate query embedding')
    }

    const queryEmbedding = embeddingsResponse.chunks[0].embedding

    console.log('[searchHybridRag] Query embedding generated, dimension:', queryEmbedding.length)

    // 2. Get user's firm_id for private search
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (profileError || !profileData) {
      console.error('[searchHybridRag] Error fetching user profile:', profileError)
      throw new Error('Failed to fetch user profile')
    }

    const firmId = profileData.firm_id

    // 3. Search public chunks
    console.log('[searchHybridRag] Searching public chunks')

    const { data: publicResults, error: publicError } = await supabase.rpc(
      'search_public_chunks',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_count: limit,
      }
    )

    if (publicError) {
      console.error('[searchHybridRag] Error searching public chunks:', publicError)
      // Don't throw, just return empty results
    }

    // 4. Search private chunks
    console.log('[searchHybridRag] Searching private chunks for firm:', firmId)

    const { data: privateResults, error: privateError } = await supabase.rpc(
      'search_private_chunks',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        user_firm_id: firmId,
        match_count: limit,
      }
    )

    if (privateError) {
      console.error('[searchHybridRag] Error searching private chunks:', privateError)
      // Don't throw, just return empty results
    }

    // 5. Fetch document metadata for public chunks
    const publicChunks: PublicChunkResult[] = []

    if (publicResults && publicResults.length > 0) {
      const docIds = [...new Set(publicResults.map((r: any) => r.doc_id))]

      const { data: publicDocs, error: publicDocsError } = await supabase
        .from('rag_public_docs')
        .select('id, title, doc_type, court, date, url')
        .in('id', docIds)

      if (!publicDocsError && publicDocs) {
        const docsMap = new Map(publicDocs.map((doc) => [doc.id, doc]))

        publicChunks.push(
          ...publicResults.map((result: any) => {
            const doc = docsMap.get(result.doc_id)
            return {
              docId: result.doc_id,
              title: doc?.title || null,
              docType: doc?.doc_type || null,
              court: doc?.court || null,
              date: doc?.date || null,
              url: doc?.url || null,
              chunkText: result.chunk_text,
              similarity: result.similarity,
            }
          })
        )
      }
    }

    // 6. Fetch document metadata for private chunks
    const privateChunks: PrivateChunkResult[] = []

    if (privateResults && privateResults.length > 0) {
      const docIds = [...new Set(privateResults.map((r: any) => r.doc_id))]

      const { data: privateDocs, error: privateDocsError } = await supabase
        .from('rag_private_docs')
        .select('id, title, case_id')
        .in('id', docIds)

      if (!privateDocsError && privateDocs) {
        const docsMap = new Map(privateDocs.map((doc) => [doc.id, doc]))

        privateChunks.push(
          ...privateResults.map((result: any) => {
            const doc = docsMap.get(result.doc_id)
            return {
              docId: result.doc_id,
              title: doc?.title || null,
              caseId: doc?.case_id || null,
              chunkText: result.chunk_text,
              similarity: result.similarity,
            }
          })
        )
      }
    }

    // 7. Sort by similarity (highest first)
    publicChunks.sort((a, b) => b.similarity - a.similarity)
    privateChunks.sort((a, b) => b.similarity - a.similarity)

    console.log('[searchHybridRag] Found', publicChunks.length, 'public chunks and', privateChunks.length, 'private chunks')

    return {
      publicChunks,
      privateChunks,
    }
  } catch (error: any) {
    console.error('[searchHybridRag] Error:', error)
    throw new Error(error.message || 'Failed to perform hybrid RAG search')
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Map hybrid search results to unified RagSource array
 * 
 * @param hybridResult Result from searchHybridRag
 * @returns Unified array of sources sorted by similarity
 */
export function mapHybridResultToSources(hybridResult: HybridSearchResult): RagSource[] {
  const sources: RagSource[] = []

  // Map public chunks
  for (const chunk of hybridResult.publicChunks) {
    sources.push({
      id: chunk.docId,
      title: chunk.title,
      docType: chunk.docType,
      court: chunk.court,
      url: chunk.url,
      similarity: chunk.similarity,
      scope: 'public',
      snippet: chunk.chunkText.substring(0, 400) + (chunk.chunkText.length > 400 ? '...' : ''),
    })
  }

  // Map private chunks
  for (const chunk of hybridResult.privateChunks) {
    sources.push({
      id: chunk.docId,
      title: chunk.title,
      docType: null,
      court: null,
      url: null,
      similarity: chunk.similarity,
      scope: 'private',
      snippet: chunk.chunkText.substring(0, 400) + (chunk.chunkText.length > 400 ? '...' : ''),
    })
  }

  // Sort by similarity (highest first)
  sources.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))

  return sources
}

// =====================================================
// ADMIN: PUBLIC DOCUMENT IMPORT
// =====================================================

/**
 * Legal area types for categorization
 */
export type LegalArea = 'ceza' | 'borçlar' | 'icra_iflas' | 'medeni' | 'ticaret' | 'anayasa' | 'genel'

/**
 * Document type for classification
 */
export type DocumentType = 'kanun' | 'içtihat' | 'makale' | 'genel'

/**
 * Create a new public legal document record
 */
export async function createPublicLegalDoc(params: {
  title: string
  area: LegalArea
  docType: DocumentType
  court?: string | null
  year?: number | null
  storagePath: string
  textLength: number
}): Promise<string> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('public_legal_docs')
      .insert({
        title: params.title,
        legal_area: params.area, // Changed from 'area' to 'legal_area'
        doc_type: params.docType,
        court: params.court,
        year: params.year,
        file_url: params.storagePath, // Changed from 'storage_path' to 'file_url'
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createPublicLegalDoc] Error:', error)
      throw new Error(`Doküman kaydedilemedi: ${error.message}`)
    }

    return data.id
  } catch (error: any) {
    console.error('[createPublicLegalDoc] Exception:', error)
    throw new Error(error.message || 'Doküman oluşturulamadı')
  }
}

/**
 * Insert embedding chunks from n8n response
 */
export async function insertPublicChunksFromEmbeddings(params: {
  docId: string
  chunks: string[] // Array of chunk texts (n8n returns chunks array)
  embeddings?: number[][] // Optional embeddings array
}): Promise<number> {
  try {
    const supabase = await createClient()

    const chunksToInsert = params.chunks.map((chunkText, index) => ({
      doc_id: params.docId,
      chunk_index: index,
      chunk_text: chunkText, // Changed from 'content' to 'chunk_text'
      embedding: params.embeddings?.[index] || null, // Optional embedding
    }))

    const { error } = await supabase
      .from('public_legal_chunks')
      .insert(chunksToInsert)

    if (error) {
      console.error('[insertPublicChunksFromEmbeddings] Error:', error)
      throw new Error(`Chunk'lar kaydedilemedi: ${error.message}`)
    }

    return chunksToInsert.length
  } catch (error: any) {
    console.error('[insertPublicChunksFromEmbeddings] Exception:', error)
    throw new Error(error.message || 'Chunk ekleme başarısız')
  }
}

/**
 * Get document by ID
 */
export async function getPublicLegalDocById(docId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('public_legal_docs')
      .select('*')
      .eq('id', docId)
      .single()

    if (error) {
      console.error('[getPublicLegalDocById] Error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[getPublicLegalDocById] Exception:', error)
    return null
  }
}

/**
 * List all public legal documents (for admin)
 */
export async function listPublicLegalDocs(params?: {
  limit?: number
  offset?: number
  area?: LegalArea
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('public_legal_docs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params?.area) {
      query = query.eq('area', params.area)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[listPublicLegalDocs] Error:', error)
      throw new Error('Dokümanlar yüklenemedi')
    }

    return { documents: data, total: count || 0 }
  } catch (error) {
    console.error('[listPublicLegalDocs] Exception:', error)
    throw error
  }
}
