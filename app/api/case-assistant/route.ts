/**
 * Case Assistant API Route
 * 
 * Handles case analysis via n8n webhook
 * Analyzes case files and provides:
 * - Event summary
 * - Defence outline
 * - Action items
 * - Relevant case law sources (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { callN8NWebhook } from '../../../src/lib/n8n'

/**
 * Request body type
 */
type CaseAssistantRequest = {
  fileUrl: string
  caseType: string
  shortDescription?: string
}

/**
 * n8n response type
 */
type CaseAssistantResponse = {
  eventSummary: string
  defenceOutline: string
  actionItems: string[]
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

    // Call n8n webhook
    const result = await callN8NWebhook<CaseAssistantResponse>(
      'CASE_ASSISTANT',
      {
        userId: user.id,
        caseType,
        shortDescription: shortDescription ?? null,
        fileUrl,
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

