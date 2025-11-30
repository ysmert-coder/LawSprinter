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
      console.log('[strategy] Using BYO API key')
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

      console.log('[strategy] Using trial credits (remaining:', remaining, ')')
    }

    // Step 4: Search for relevant sources via RAG
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

    // Step 5: Call n8n webhook with sources (and optional LLM config)
    const n8nPayload: any = {
      userId: user.id,
      area,
      question,
      fileUrl: fileUrl ?? null,
      sources,
    }

    if (llmConfig) {
      n8nPayload.llmConfig = llmConfig
    }

    const result = await callN8NWebhook<StrategyResponse>('STRATEGY', n8nPayload)

    // Step 6: Log usage and decrement credits if applicable
    if (!hasByok) {
      await incrementTrialCreditsUsed(firm.id, 1)
      await logAIUsage({
        firm_id: firm.id,
        user_id: user.id,
        feature: 'STRATEGY',
        credits_used: 1,
        used_trial: true,
      })
    } else {
      await logAIUsage({
        firm_id: firm.id,
        user_id: user.id,
        feature: 'STRATEGY',
        credits_used: 0,
        used_trial: false,
      })
    }

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

