/**
 * Pleading Generator API Route
 * 
 * Generates legal pleading drafts with RAG-powered context
 * Uses n8n PLEADING_GENERATOR workflow for AI generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../lib/n8n'
import { searchHybridRag, mapHybridResultToSources, type RagSource } from '../../../lib/services/rag'
import { checkBillingForAI, logAICall } from '../../../lib/middleware/billingCheck'

/**
 * Request body type
 */
export interface PleadingGenerateRequest {
  /** Type of case (e.g., 'ceza', 'icra', 'aile', 'ticaret') */
  caseType: string
  /** Short description of the case/situation */
  shortDescription: string
  /** Optional file URL from Supabase Storage */
  fileUrl?: string
}

/**
 * Response type from n8n workflow
 */
export interface PleadingGenerateResponse {
  /** Full pleading draft text */
  draftText: string
  /** Optional structured sections */
  sections?: {
    introduction?: string
    facts?: string
    legalBasis?: string
    requests?: string
  }
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
    const body: PleadingGenerateRequest = await request.json()
    const { caseType, shortDescription, fileUrl } = body

    // Validate required fields
    if (!caseType || !caseType.trim()) {
      return NextResponse.json({ error: 'caseType is required' }, { status: 400 })
    }

    if (!shortDescription || !shortDescription.trim()) {
      return NextResponse.json({ error: 'shortDescription is required' }, { status: 400 })
    }

    console.log('[pleading-generate] Processing request for user:', user.id)
    console.log('[pleading-generate] Case type:', caseType)
    console.log('[pleading-generate] Description length:', shortDescription.length)

    // Step 1: Check billing and get LLM config if needed
    const billingCheck = await checkBillingForAI(user.id)
    if (!billingCheck.success) {
      return billingCheck.error_response!
    }

    // Step 2: Search for relevant sources via RAG
    let sources: RagSource[] = []

    try {
      console.log('[pleading-generate] Searching RAG for relevant sources...')

      const ragResults = await searchHybridRag({
        userId: user.id,
        query: shortDescription,
        limit: 8,
      })

      // Map to unified source format
      sources = mapHybridResultToSources(ragResults)

      console.log('[pleading-generate] Found', sources.length, 'relevant sources from RAG')
    } catch (ragError: any) {
      console.error('[pleading-generate] RAG search failed, continuing without sources:', ragError.message)
      // Continue with empty sources array
      sources = []
    }

    // Step 3: Call n8n webhook with sources (and optional LLM config)
    const n8nPayload: any = {
      userId: user.id,
      caseType: caseType.trim(),
      shortDescription: shortDescription.trim(),
      fileUrl: fileUrl?.trim() || null,
      sources,
    }

    if (billingCheck.llm_config) {
      n8nPayload.llmConfig = billingCheck.llm_config
    }

    const result = await callN8NWebhook<PleadingGenerateResponse>('PLEADING_GENERATOR', n8nPayload)

    // Step 4: Log usage
    await logAICall(billingCheck.firm_id!, user.id, 'PLEADING_GENERATE', billingCheck.has_byok!)

    console.log('[pleading-generate] Pleading draft generated successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[pleading-generate] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Pleading generation failed',
      },
      { status: 500 }
    )
  }
}

