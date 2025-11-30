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
import {
  getFirmForUser,
  getFirmBilling,
  getRemainingTrialCredits,
  incrementTrialCreditsUsed,
  logAIUsage,
  checkSubscriptionActive,
} from '../../../lib/services/billing'
import { getDecryptedAISettings, hasFirmByok } from '../../../lib/services/aiSettings'
import { LLMConfig } from '../../../lib/types/billing'

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

    // Step 1: Get firm and billing info
    const firm = await getFirmForUser(user.id)
    if (!firm) {
      return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
    }

    const billing = await getFirmBilling(firm.id)

    // Step 2: Check subscription status
    if (!checkSubscriptionActive(billing)) {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Aboneliğinizin süresi doldu. Lütfen planınızı yenileyin.',
        },
        { status: 402 }
      )
    }

    // Step 3: Check BYO key or trial credits
    const hasByok = await hasFirmByok(firm.id)
    let llmConfig: LLMConfig | undefined

    if (hasByok) {
      // User has BYO key - get decrypted settings
      console.log('[case-assistant] Using BYO API key')
      const aiSettings = await getDecryptedAISettings(firm.id)
      
      if (!aiSettings) {
        return NextResponse.json(
          {
            error: 'BYOK_NOT_CONFIGURED',
            message: 'API anahtarı yapılandırması bulunamadı',
          },
          { status: 500 }
        )
      }

      llmConfig = {
        provider: aiSettings.provider,
        model: aiSettings.model,
        api_key: aiSettings.api_key,
      }
    } else {
      // Check trial credits
      const remaining = await getRemainingTrialCredits(firm.id)
      
      if (remaining <= 0) {
        return NextResponse.json(
          {
            error: 'TRIAL_CREDITS_EXHAUSTED',
            message:
              'Ücretsiz AI kredileriniz tükendi. AI modüllerini kullanmaya devam etmek için abonelik planı seçebilir veya kendi API anahtarınızı ekleyebilirsiniz.',
          },
          { status: 402 }
        )
      }

      console.log('[case-assistant] Using trial credits (remaining:', remaining, ')')
    }

    // Step 4: Search for relevant sources via RAG
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

    // Step 5: Call n8n webhook with sources (and optional LLM config)
    const n8nPayload: any = {
      userId: user.id,
      caseType,
      shortDescription: shortDescription ?? null,
      fileUrl,
      sources,
    }

    // Add LLM config if BYO key is used
    if (llmConfig) {
      n8nPayload.llmConfig = llmConfig
    }

    const result = await callN8NWebhook<CaseAssistantResponse>('CASE_ASSISTANT', n8nPayload)

    // Step 6: Log usage and decrement credits if applicable
    if (!hasByok) {
      // Using trial credits
      await incrementTrialCreditsUsed(firm.id, 1)
      await logAIUsage({
        firm_id: firm.id,
        user_id: user.id,
        feature: 'CASE_ASSISTANT',
        credits_used: 1,
        used_trial: true,
      })
    } else {
      // Using BYO key (no credit deduction)
      await logAIUsage({
        firm_id: firm.id,
        user_id: user.id,
        feature: 'CASE_ASSISTANT',
        credits_used: 0,
        used_trial: false,
      })
    }

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

