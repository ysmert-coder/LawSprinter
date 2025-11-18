/**
 * Strategy API Route
 * 
 * Handles legal strategy generation via n8n
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import { generateStrategyWithAI } from '../../../src/lib/services/ai'

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
    const body = await request.json()
    const { area, fileUrl, question, caseId } = body

    if (!area || !question) {
      return NextResponse.json({ error: 'Area and question are required' }, { status: 400 })
    }

    // Call n8n webhook via AI service
    const strategy = await generateStrategyWithAI({
      userId: user.id,
      area,
      fileUrl,
      question,
      caseId,
    })

    return NextResponse.json({
      success: true,
      strategy,
    })
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

