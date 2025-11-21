/**
 * RAG (Retrieval Augmented Generation) Service
 * 
 * This service handles:
 * 1. Inserting legal documents with embeddings (case law, legislation, doctrine)
 * 2. Inserting private case-specific chunks with embeddings
 * 3. Semantic search using pgvector
 * 
 * Embeddings are generated externally (via n8n workflows) and passed to these functions.
 * 
 * @module services/rag
 */

import { createClient } from '../supabaseServer'
import { 
  Database, 
  InsertDto, 
  LegalDocument, 
  LegalChunk,
  PrivateCaseChunk,
  LegalSearchResult,
  PrivateCaseSearchResult
} from '@/types/database'

type LegalDocumentInsert = InsertDto<'legal_documents'>
type LegalChunkInsert = InsertDto<'legal_chunks'>
type PrivateCaseChunkInsert = InsertDto<'private_case_chunks'>

// =====================================================
// LEGAL DOCUMENTS - Public Knowledge Base
// =====================================================

/**
 * Insert a legal document with its chunked content and embeddings
 * 
 * This function is used to populate the public legal knowledge base with:
 * - Yargıtay decisions (case law)
 * - Legislation (kanun, yönetmelik)
 * - Legal doctrine (doktrin, makale)
 * 
 * @param doc - Document metadata
 * @param chunks - Array of text chunks with their embeddings (from n8n)
 * @returns The created document with its ID
 * 
 * @example
 * ```typescript
 * await insertLegalDocumentWithChunks(
 *   {
 *     title: 'Yargıtay 9. HD E.2023/1234 K.2023/5678',
 *     source: 'Yargıtay',
 *     docType: 'içtihat',
 *     court: 'Yargıtay',
 *     chamber: '9. Hukuk Dairesi',
 *     decisionNo: 'E.2023/1234 K.2023/5678',
 *     date: '2023-06-15',
 *     url: 'https://kazanci.com/...',
 *     metadata: { keywords: ['kıdem tazminatı', 'iş hukuku'] }
 *   },
 *   [
 *     { content: 'Chunk 1 text...', chunkIndex: 0, embedding: [0.1, 0.2, ...] },
 *     { content: 'Chunk 2 text...', chunkIndex: 1, embedding: [0.3, 0.4, ...] }
 *   ]
 * )
 * ```
 */
export async function insertLegalDocumentWithChunks(
  doc: {
    title: string
    source: string
    docType: string
    court?: string
    chamber?: string
    decisionNo?: string
    fileNo?: string
    date?: string
    url?: string
    metadata?: any
  },
  chunks: {
    content: string
    chunkIndex: number
    embedding: number[]
  }[]
): Promise<LegalDocument> {
  try {
    const supabase = await createClient()

    // 1. Insert the document metadata
    const documentData: LegalDocumentInsert = {
      title: doc.title,
      source: doc.source,
      doc_type: doc.docType,
      court: doc.court,
      chamber: doc.chamber,
      decision_no: doc.decisionNo,
      file_no: doc.fileNo,
      date: doc.date,
      url: doc.url,
      metadata: doc.metadata || {},
      is_active: true,
    }

    const { data: newDocument, error: docError } = await supabase
      .from('legal_documents')
      .insert(documentData)
      .select()
      .single()

    if (docError) {
      console.error('[insertLegalDocumentWithChunks] Document insert error:', docError)
      throw new Error(`Failed to insert legal document: ${docError.message}`)
    }

    console.log('[insertLegalDocumentWithChunks] Document created:', newDocument.id)

    // 2. Insert all chunks with embeddings
    if (chunks.length > 0) {
      const chunkData: LegalChunkInsert[] = chunks.map((chunk) => ({
        document_id: newDocument.id,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding, // pgvector will handle the conversion
      }))

      const { error: chunksError } = await supabase
        .from('legal_chunks')
        .insert(chunkData)

      if (chunksError) {
        console.error('[insertLegalDocumentWithChunks] Chunks insert error:', chunksError)
        // Rollback: delete the document if chunks failed
        await supabase.from('legal_documents').delete().eq('id', newDocument.id)
        throw new Error(`Failed to insert legal chunks: ${chunksError.message}`)
      }

      console.log('[insertLegalDocumentWithChunks] Inserted', chunks.length, 'chunks')
    }

    return newDocument
  } catch (error) {
    console.error('[insertLegalDocumentWithChunks] Exception:', error)
    throw error
  }
}

/**
 * Search legal documents using semantic similarity
 * 
 * @param queryEmbedding - The embedding vector of the search query (from n8n)
 * @param options - Search options
 * @returns Array of matching chunks with similarity scores
 * 
 * @example
 * ```typescript
 * const results = await searchLegalDocuments(
 *   [0.1, 0.2, ...], // query embedding from n8n
 *   {
 *     matchCount: 5,
 *     docType: 'içtihat',
 *     court: 'Yargıtay'
 *   }
 * )
 * ```
 */
export async function searchLegalDocuments(
  queryEmbedding: number[],
  options: {
    matchCount?: number
    docType?: string
    court?: string
  } = {}
): Promise<LegalSearchResult[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('search_legal_documents', {
      query_embedding: queryEmbedding,
      match_count: options.matchCount || 5,
      doc_type_filter: options.docType || null,
      court_filter: options.court || null,
    })

    if (error) {
      console.error('[searchLegalDocuments] Error:', error)
      throw new Error(`Failed to search legal documents: ${error.message}`)
    }

    console.log('[searchLegalDocuments] Found', data?.length || 0, 'results')
    return data || []
  } catch (error) {
    console.error('[searchLegalDocuments] Exception:', error)
    throw error
  }
}

/**
 * Get a legal document by ID with all its chunks
 * 
 * @param documentId - The document UUID
 * @returns Document with chunks, or null if not found
 */
export async function getLegalDocumentWithChunks(
  documentId: string
): Promise<(LegalDocument & { chunks: LegalChunk[] }) | null> {
  try {
    const supabase = await createClient()

    // Get document
    const { data: doc, error: docError } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError) {
      if (docError.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch document: ${docError.message}`)
    }

    // Get chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('legal_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })

    if (chunksError) {
      throw new Error(`Failed to fetch chunks: ${chunksError.message}`)
    }

    return {
      ...doc,
      chunks: chunks || [],
    }
  } catch (error) {
    console.error('[getLegalDocumentWithChunks] Exception:', error)
    throw error
  }
}

/**
 * Soft delete a legal document (sets is_active to false)
 * 
 * @param documentId - The document UUID
 */
export async function deactivateLegalDocument(documentId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('legal_documents')
      .update({ is_active: false })
      .eq('id', documentId)

    if (error) {
      throw new Error(`Failed to deactivate document: ${error.message}`)
    }

    console.log('[deactivateLegalDocument] Document deactivated:', documentId)
  } catch (error) {
    console.error('[deactivateLegalDocument] Exception:', error)
    throw error
  }
}

// =====================================================
// PRIVATE CASE CHUNKS - User/Firm-Specific Knowledge
// =====================================================

/**
 * Insert private case-specific chunks with embeddings
 * 
 * This is used for user-uploaded content specific to a case:
 * - Uploaded PDF documents
 * - Case notes
 * - Email transcripts
 * - Meeting notes
 * 
 * @param userId - The user ID (from auth.users)
 * @param caseId - The case ID
 * @param chunks - Array of text chunks with embeddings (from n8n)
 * @returns Array of inserted chunk IDs
 * 
 * @example
 * ```typescript
 * await insertPrivateCaseChunks(
 *   'user-uuid',
 *   'case-uuid',
 *   [
 *     { 
 *       content: 'Meeting notes from 2023-06-15...', 
 *       source: 'note', 
 *       embedding: [0.1, 0.2, ...] 
 *     },
 *     { 
 *       content: 'Email from client...', 
 *       source: 'email', 
 *       embedding: [0.3, 0.4, ...] 
 *     }
 *   ]
 * )
 * ```
 */
export async function insertPrivateCaseChunks(
  userId: string,
  caseId: string,
  chunks: {
    content: string
    source: string
    embedding: number[]
  }[]
): Promise<number[]> {
  try {
    const supabase = await createClient()

    if (chunks.length === 0) {
      return []
    }

    // Prepare chunk data
    const chunkData: PrivateCaseChunkInsert[] = chunks.map((chunk) => ({
      user_id: userId,
      case_id: caseId,
      source: chunk.source,
      content: chunk.content,
      embedding: chunk.embedding, // pgvector will handle the conversion
    }))

    const { data, error } = await supabase
      .from('private_case_chunks')
      .insert(chunkData)
      .select('id')

    if (error) {
      console.error('[insertPrivateCaseChunks] Error:', error)
      throw new Error(`Failed to insert private case chunks: ${error.message}`)
    }

    const insertedIds = data?.map((row) => row.id) || []
    console.log('[insertPrivateCaseChunks] Inserted', insertedIds.length, 'chunks for case', caseId)

    return insertedIds
  } catch (error) {
    console.error('[insertPrivateCaseChunks] Exception:', error)
    throw error
  }
}

/**
 * Search private case chunks using semantic similarity
 * 
 * @param userId - The user ID (for RLS)
 * @param caseId - The case ID
 * @param queryEmbedding - The embedding vector of the search query (from n8n)
 * @param matchCount - Number of results to return
 * @returns Array of matching chunks with similarity scores
 * 
 * @example
 * ```typescript
 * const results = await searchPrivateCaseChunks(
 *   'user-uuid',
 *   'case-uuid',
 *   [0.1, 0.2, ...], // query embedding from n8n
 *   5
 * )
 * ```
 */
export async function searchPrivateCaseChunks(
  userId: string,
  caseId: string,
  queryEmbedding: number[],
  matchCount: number = 5
): Promise<PrivateCaseSearchResult[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('search_private_case_chunks', {
      p_user_id: userId,
      p_case_id: caseId,
      query_embedding: queryEmbedding,
      match_count: matchCount,
    })

    if (error) {
      console.error('[searchPrivateCaseChunks] Error:', error)
      throw new Error(`Failed to search private case chunks: ${error.message}`)
    }

    console.log('[searchPrivateCaseChunks] Found', data?.length || 0, 'results for case', caseId)
    return data || []
  } catch (error) {
    console.error('[searchPrivateCaseChunks] Exception:', error)
    throw error
  }
}

/**
 * Get all private chunks for a case
 * 
 * @param userId - The user ID (for RLS)
 * @param caseId - The case ID
 * @returns Array of all chunks for the case
 */
export async function getPrivateCaseChunks(
  userId: string,
  caseId: string
): Promise<PrivateCaseChunk[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('private_case_chunks')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getPrivateCaseChunks] Error:', error)
      throw new Error(`Failed to fetch private case chunks: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('[getPrivateCaseChunks] Exception:', error)
    throw error
  }
}

/**
 * Delete private case chunks
 * 
 * @param userId - The user ID (for RLS)
 * @param chunkIds - Array of chunk IDs to delete
 */
export async function deletePrivateCaseChunks(
  userId: string,
  chunkIds: number[]
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('private_case_chunks')
      .delete()
      .in('id', chunkIds)

    if (error) {
      console.error('[deletePrivateCaseChunks] Error:', error)
      throw new Error(`Failed to delete private case chunks: ${error.message}`)
    }

    console.log('[deletePrivateCaseChunks] Deleted', chunkIds.length, 'chunks')
  } catch (error) {
    console.error('[deletePrivateCaseChunks] Exception:', error)
    throw error
  }
}

/**
 * Delete all private chunks for a case
 * 
 * @param userId - The user ID (for RLS)
 * @param caseId - The case ID
 */
export async function deleteAllPrivateCaseChunks(
  userId: string,
  caseId: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('private_case_chunks')
      .delete()
      .eq('case_id', caseId)

    if (error) {
      console.error('[deleteAllPrivateCaseChunks] Error:', error)
      throw new Error(`Failed to delete all private case chunks: ${error.message}`)
    }

    console.log('[deleteAllPrivateCaseChunks] Deleted all chunks for case', caseId)
  } catch (error) {
    console.error('[deleteAllPrivateCaseChunks] Exception:', error)
    throw error
  }
}

// =====================================================
// HYBRID SEARCH - Combine Public + Private Knowledge
// =====================================================

/**
 * Hybrid search: Search both public legal documents and private case chunks
 * 
 * This is useful for AI-powered case analysis where you want to:
 * 1. Find relevant case law from public knowledge base
 * 2. Find relevant case-specific information from private uploads
 * 
 * @param userId - The user ID
 * @param caseId - The case ID
 * @param queryEmbedding - The embedding vector of the search query
 * @param options - Search options
 * @returns Combined results from both sources
 * 
 * @example
 * ```typescript
 * const results = await hybridSearch(
 *   'user-uuid',
 *   'case-uuid',
 *   [0.1, 0.2, ...],
 *   {
 *     publicMatchCount: 3,
 *     privateMatchCount: 2,
 *     docType: 'içtihat'
 *   }
 * )
 * ```
 */
export async function hybridSearch(
  userId: string,
  caseId: string,
  queryEmbedding: number[],
  options: {
    publicMatchCount?: number
    privateMatchCount?: number
    docType?: string
    court?: string
  } = {}
): Promise<{
  publicResults: LegalSearchResult[]
  privateResults: PrivateCaseSearchResult[]
}> {
  try {
    // Search both in parallel
    const [publicResults, privateResults] = await Promise.all([
      searchLegalDocuments(queryEmbedding, {
        matchCount: options.publicMatchCount || 5,
        docType: options.docType,
        court: options.court,
      }),
      searchPrivateCaseChunks(
        userId,
        caseId,
        queryEmbedding,
        options.privateMatchCount || 5
      ),
    ])

    console.log('[hybridSearch] Found', publicResults.length, 'public +', privateResults.length, 'private results')

    return {
      publicResults,
      privateResults,
    }
  } catch (error) {
    console.error('[hybridSearch] Exception:', error)
    throw error
  }
}

// =====================================================
// STATISTICS & MONITORING
// =====================================================

/**
 * Get RAG system statistics
 * 
 * @returns Statistics about the RAG system
 */
export async function getRagStatistics(): Promise<{
  totalDocuments: number
  totalChunks: number
  totalPrivateChunks: number
  documentsByType: { doc_type: string; count: number }[]
  documentsByCourt: { court: string; count: number }[]
}> {
  try {
    const supabase = await createClient()

    // Total documents
    const { count: totalDocuments } = await supabase
      .from('legal_documents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total chunks
    const { count: totalChunks } = await supabase
      .from('legal_chunks')
      .select('*', { count: 'exact', head: true })

    // Total private chunks
    const { count: totalPrivateChunks } = await supabase
      .from('private_case_chunks')
      .select('*', { count: 'exact', head: true })

    // Documents by type
    const { data: byType } = await supabase
      .from('legal_documents')
      .select('doc_type')
      .eq('is_active', true)

    const documentsByType = Object.entries(
      (byType || []).reduce((acc: any, row: any) => {
        acc[row.doc_type] = (acc[row.doc_type] || 0) + 1
        return acc
      }, {})
    ).map(([doc_type, count]) => ({ doc_type, count: count as number }))

    // Documents by court
    const { data: byCourt } = await supabase
      .from('legal_documents')
      .select('court')
      .eq('is_active', true)
      .not('court', 'is', null)

    const documentsByCourt = Object.entries(
      (byCourt || []).reduce((acc: any, row: any) => {
        acc[row.court] = (acc[row.court] || 0) + 1
        return acc
      }, {})
    ).map(([court, count]) => ({ court, count: count as number }))

    return {
      totalDocuments: totalDocuments || 0,
      totalChunks: totalChunks || 0,
      totalPrivateChunks: totalPrivateChunks || 0,
      documentsByType,
      documentsByCourt,
    }
  } catch (error) {
    console.error('[getRagStatistics] Exception:', error)
    throw error
  }
}

