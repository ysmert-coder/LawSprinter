/**
 * Draft Review API Route
 * 
 * Reviews legal drafts and provides AI-powered feedback
 * Identifies issues, suggests improvements, and recommends legal citations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { reviewDraft } from '../../../../lib/services/ai'

/**
 * Request body type
 */
type ReviewRequest = {
  caseId?: string
  caseType?: string
  draftText: string
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
    const body: ReviewRequest = await request.json()
    const { caseId, caseType, draftText } = body

    // Validate required fields
    if (!draftText || !draftText.trim()) {
      return NextResponse.json({ error: 'draftText is required' }, { status: 400 })
    }

    // If caseId is provided, verify case belongs to user's firm
    if (caseId) {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id, firm_id')
        .eq('id', caseId)
        .single()

      if (caseError || !caseData) {
        console.error('[draft-review] Case not found:', caseError)
        return NextResponse.json({ error: 'Dava bulunamadı' }, { status: 404 })
      }

      // Check if user belongs to the same firm
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        console.error('[draft-review] Profile not found:', profileError)
        return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 })
      }

      if (caseData.firm_id !== profileData.firm_id) {
        console.error('[draft-review] Unauthorized access attempt:', {
          userId: user.id,
          caseId,
          caseFirmId: caseData.firm_id,
          userFirmId: profileData.firm_id,
        })
        return NextResponse.json(
          { error: 'Bu davaya erişim yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    console.log('[draft-review] Reviewing draft for user:', user.id)
    if (caseId) {
      console.log('[draft-review] Case ID:', caseId)
    }
    if (caseType) {
      console.log('[draft-review] Case type:', caseType)
    }

    // Call AI service
    const result = await reviewDraft({
      userId: user.id,
      caseId,
      caseType,
      draftText: draftText.trim(),
    })

    console.log('[draft-review] Review completed successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[draft-review] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Taslak inceleme sırasında bir hata oluştu',
      },
      { status: 500 }
    )
  }
}

