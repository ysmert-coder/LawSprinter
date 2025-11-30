/**
 * Pleading Review API Route
 * 
 * Reviews and improves existing legal pleading drafts
 * Uses n8n PLEADING_REVIEW workflow for AI analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../lib/n8n'
import { searchHybridRag, mapHybridResultToSources, type RagSource } from '../../../lib/services/rag'
import { checkBillingForAI, logAICall } from '../../../lib/middleware/billingCheck'

/**
 * Request body type
 */
export interface PleadingReviewRequest {
  /** Type of case (e.g., 'ceza', 'icra', 'aile', 'ticaret') */
  caseType: string
  /** Existing pleading text to review */
  existingText?: string
  /** Optional file URL from Supabase Storage */
  fileUrl?: string
}

/**
 * Response type from n8n workflow
 */
export interface PleadingReviewResponse {
  /** Improved version of the pleading (optional) */
  improvedText?: string
  /** List of missing arguments */
  missingArguments?: string[]
  /** Structural suggestions */
  structureSuggestions?: string[]
  /** Risk points / weaknesses */
  riskPoints?: string[]
  /** Sources used from RAG */
  sources?: RagSource[]
  /** AI confidence score (0-1) */
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
    const body: PleadingReviewRequest = await request.json()
    const { caseType, existingText, fileUrl } = body

    // Validate required fields
    if (!caseType || !caseType.trim()) {
      return NextResponse.json({ error: 'caseType is required' }, { status: 400 })
    }

    // Check if we have text to review
    if (!existingText && fileUrl) {
      return NextResponse.json(
        {
          error: 'Dosyadan metin okuma henüz desteklenmiyor. Lütfen metni direkt olarak yapıştırın.',
        },
        { status: 400 }
      )
    }

    if (!existingText || !existingText.trim()) {
      return NextResponse.json(
        {
          error: 'existingText is required. Please provide the pleading text to review.',
        },
        { status: 400 }
      )
    }

    console.log('[pleading-review] Processing request for user:', user.id)
    console.log('[pleading-review] Case type:', caseType)
    console.log('[pleading-review] Text length:', existingText.length)

    // Step 1: Check billing and get LLM config if needed
    const billingCheck = await checkBillingForAI(user.id)
    if (!billingCheck.success) {
      return billingCheck.error_response!
    }

    // Step 2: Search for relevant sources via RAG
    let sources: RagSource[] = []

    try {
      console.log('[pleading-review] Searching RAG for relevant sources...')

      // Use existing text as query (or fallback)
      const query = existingText.trim().substring(0, 500) || 'dilekçe inceleme'

      const ragResults = await searchHybridRag({
        userId: user.id,
        query,
        limit: 8,
      })

      // Map to unified source format
      sources = mapHybridResultToSources(ragResults)

      console.log('[pleading-review] Found', sources.length, 'relevant sources from RAG')
    } catch (ragError: any) {
      console.error('[pleading-review] RAG search failed, continuing without sources:', ragError.message)
      // Continue with empty sources array
      sources = []
    }

    // Step 3: Call n8n webhook with sources (and optional LLM config)
    const n8nPayload: any = {
      userId: user.id,
      caseType: caseType.trim(),
      existingText: existingText.trim(),
      fileUrl: fileUrl?.trim() || null,
      sources,
    }

    if (billingCheck.llm_config) {
      n8nPayload.llmConfig = billingCheck.llm_config
    }

    const result = await callN8NWebhook<PleadingReviewResponse>('PLEADING_REVIEW', n8nPayload)

    // Step 4: Log usage
    await logAICall(billingCheck.firm_id!, user.id, 'PLEADING_REVIEW', billingCheck.has_byok!)

    console.log('[pleading-review] Pleading review completed successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[pleading-review] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Pleading review failed',
      },
      { status: 500 }
    )
  }
}

