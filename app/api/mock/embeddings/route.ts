/**
 * Mock Embeddings Endpoint
 * 
 * Temporary endpoint for testing RAG import without n8n
 * Returns dummy embeddings for development
 * 
 * TODO: Replace with real n8n webhook in production
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { docId, text, isPublic } = body

    console.log('[Mock Embeddings] Request:', { docId, textLength: text?.length, isPublic })

    // Validate input
    if (!docId || !text) {
      return NextResponse.json(
        { error: 'docId and text are required' },
        { status: 400 }
      )
    }

    // Simple text chunking (2000 chars per chunk, 200 char overlap)
    const chunkSize = 2000
    const overlap = 200
    const chunks: string[] = []
    
    let start = 0
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.substring(start, end))
      start += chunkSize - overlap
    }

    console.log('[Mock Embeddings] Created', chunks.length, 'chunks')

    // Generate dummy embeddings (1536 dimensions for OpenAI text-embedding-3-small)
    const embeddingDimension = 1536
    const mockChunks = chunks.map((content, index) => {
      // Create a pseudo-random but consistent embedding based on content
      const seed = content.length + index
      const embedding = Array.from({ length: embeddingDimension }, (_, i) => {
        // Simple deterministic "random" number between -1 and 1
        return Math.sin(seed * (i + 1)) * 0.5
      })

      return {
        content,
        embedding,
      }
    })

    // Simulate processing delay (like real API)
    await new Promise(resolve => setTimeout(resolve, 500))

    const response = {
      docId,
      chunks: mockChunks,
      totalChunks: mockChunks.length,
      model: 'mock-embedding-model',
      note: '⚠️ This is a MOCK response. Replace with real n8n webhook in production.',
    }

    console.log('[Mock Embeddings] Success:', {
      docId,
      totalChunks: response.totalChunks,
      embeddingDimension,
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('[Mock Embeddings] Error:', error)
    return NextResponse.json(
      {
        error: 'Mock embedding generation failed',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

