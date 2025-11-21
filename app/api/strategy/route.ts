/**
 * Strategy API Route
 * 
 * Handles legal strategy generation via n8n webhook
 * Provides area-specific legal strategies with:
 * - Summary
 * - Key issues
 * - Recommended strategy
 * - Risks (optional)
 * - Relevant case law sources (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../src/lib/n8n'

/**
 * Request body type
 */
type StrategyRequest = {
  area: 'ceza' | 'gayrimenkul' | 'icra_iflas' | 'aile' | string
  question: string
  fileUrl?: string
}

/**
 * n8n response type
 */
type StrategyResponse = {
  summary: string
  keyIssues: string[]
  recommendedStrategy: string
  risks?: string[]
  sources?: {
    id?: string
    title?: string
    court?: string
    url?: string
    similarity?: number
  }[]
  confidenceScore?: number
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

    // Call n8n webhook
    const result = await callN8NWebhook<StrategyResponse>(
      'STRATEGY',
      {
        userId: user.id,
        area,
        question,
        fileUrl: fileUrl ?? null,
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

