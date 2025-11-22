/**
 * Case Assistant API Route
 * 
 * Handles case analysis via n8n webhook with RAG integration
 * Analyzes case files and provides:
 * - Event summary
 * - Defence outline
 * - Action items
 * - Relevant case law sources (RAG)
 * - AI confidence score
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../src/lib/n8n'
import { CaseAssistantRequest, CaseAssistantResponse } from '../../../lib/types/ai'
import { searchHybridRag } from '../../../lib/services/rag'

/**
 * RAG Source for Case Assistant
 */
export type CaseAssistantSource = {
  id: string
  title?: string | null
  court?: string | null
  url?: string | null
  similarity?: number
  scope: 'public' | 'private'
  snippet: string
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
    const body: CaseAssistantRequest = await request.json()
    const { fileUrl, caseType, shortDescription } = body

    // Validate required fields
    if (!fileUrl) {
      return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 })
    }

    if (!caseType) {
      return NextResponse.json({ error: 'caseType is required' }, { status: 400 })
    }

    console.log('[case-assistant] Processing request for user:', user.id)
    console.log('[case-assistant] Case type:', caseType)

    // Step 1: Search for relevant sources via RAG
    let sources: CaseAssistantSource[] = []
    
    try {
      console.log('[case-assistant] Searching RAG for relevant sources...')
      
      const ragResults = await searchHybridRag({
        userId: user.id,
        query: shortDescription || 'Genel dava analizi',
        limit: 8,
      })

      // Combine public and private chunks into sources array
      sources = [
        ...ragResults.publicChunks.map((chunk) => ({
          id: chunk.docId,
          title: chunk.title,
          court: chunk.court,
          url: chunk.url,
          similarity: chunk.similarity,
          scope: 'public' as const,
          snippet: chunk.chunkText.substring(0, 400) + (chunk.chunkText.length > 400 ? '...' : ''),
        })),
        ...ragResults.privateChunks.map((chunk) => ({
          id: chunk.docId,
          title: chunk.title,
          court: null,
          url: null,
          similarity: chunk.similarity,
          scope: 'private' as const,
          snippet: chunk.chunkText.substring(0, 400) + (chunk.chunkText.length > 400 ? '...' : ''),
        })),
      ]

      // Sort by similarity (highest first)
      sources.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))

      console.log('[case-assistant] Found', sources.length, 'relevant sources from RAG')
    } catch (ragError: any) {
      console.error('[case-assistant] RAG search failed, continuing without sources:', ragError.message)
      // Continue with empty sources array
      sources = []
    }

    // Step 2: Call n8n webhook with sources
    const result = await callN8NWebhook<CaseAssistantResponse>(
      'CASE_ASSISTANT',
      {
        userId: user.id,
        caseType,
        shortDescription: shortDescription ?? null,
        fileUrl,
        sources,
      }
    )

    console.log('[case-assistant] Analysis completed successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[case-assistant] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Case analysis failed',
      },
      { status: 500 }
    )
  }
}

