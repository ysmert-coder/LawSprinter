/**
 * Case Assistant API Route
 * 
 * Handles file upload and AI analysis via n8n
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { analyzeCaseWithAI } from '@/lib/services/ai'

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
    const { fileUrl, caseType, shortDescription, caseId } = body

    if (!caseType) {
      return NextResponse.json({ error: 'Case type is required' }, { status: 400 })
    }

    // Call n8n webhook via AI service
    const analysis = await analyzeCaseWithAI({
      userId: user.id,
      fileUrl,
      caseType,
      shortDescription,
      caseId,
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('[case-assistant] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Analysis failed',
      },
      { status: 500 }
    )
  }
}

