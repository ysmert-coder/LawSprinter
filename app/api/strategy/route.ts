/**
 * Strategy API Route
 * 
 * Handles legal strategy generation via n8n webhook with RAG integration
 * Provides area-specific legal strategies with:
 * - Summary
 * - Key issues
 * - Recommended strategy
 * - Risks (optional)
 * - Relevant case law sources (RAG)
 * - AI confidence score
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../src/lib/n8n'
import { StrategyRequest, StrategyResponse } from '../../../lib/types/ai'
import { searchHybridRag } from '../../../lib/services/rag'

/**
 * RAG Source for Strategy
 */
export type StrategySource = {
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
    const body: StrategyRequest = await request.json()
    const { area, question, fileUrl } = body

    // Validate required fields
    if (!area) {
      return NextResponse.json({ error: 'area is required' }, { status: 400 })
    }

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    console.log('[strategy] Processing request for user:', user.id)
    console.log('[strategy] Area:', area)
    console.log('[strategy] Question:', question)

    // Step 1: Search for relevant sources via RAG
    let sources: StrategySource[] = []
    
    try {
      console.log('[strategy] Searching RAG for relevant sources...')
      
      const ragResults = await searchHybridRag({
        userId: user.id,
        query: question,
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

      console.log('[strategy] Found', sources.length, 'relevant sources from RAG')
    } catch (ragError: any) {
      console.error('[strategy] RAG search failed, continuing without sources:', ragError.message)
      // Continue with empty sources array
      sources = []
    }

    // Step 2: Call n8n webhook with sources
    const result = await callN8NWebhook<StrategyResponse>(
      'STRATEGY',
      {
        userId: user.id,
        area,
        question,
        fileUrl: fileUrl ?? null,
        sources,
      }
    )

    console.log('[strategy] Strategy generated successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[strategy] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Strategy generation failed',
      },
      { status: 500 }
    )
  }
}

