/**
 * RAG Hybrid Search API
 * 
 * Performs semantic search across public and private legal documents
 * Returns relevant chunks with similarity scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { searchHybridRag } from '../../../../lib/services/rag'

/**
 * Request body type
 */
type SearchRequest = {
  query: string
  limit?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: SearchRequest = await request.json()
    const { query, limit } = body

    // Validate required fields
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    console.log('[rag-search] Searching for:', {
      query: query.substring(0, 100) + '...',
      limit: limit || 10,
      userId: user.id,
    })

    // Perform hybrid search
    const result = await searchHybridRag({
      userId: user.id,
      query: query.trim(),
      limit: limit || 10,
    })

    console.log('[rag-search] Search completed:', {
      publicChunks: result.publicChunks.length,
      privateChunks: result.privateChunks.length,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[rag-search] Error:', error)

    // Determine status code based on error
    const statusCode = error.message?.includes('required') ? 400 : 500

    return NextResponse.json(
      {
        error: error.message || 'Failed to perform search',
      },
      { status: statusCode }
    )
  }
}
