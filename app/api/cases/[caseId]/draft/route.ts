/**
 * Draft Generator API Route
 * 
 * Generates legal document drafts (petitions, responses, appeals) using AI
 * Supports: dava dilekçesi, cevap dilekçesi, istinaf, temyiz
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../src/lib/supabaseServer'
import { generateDraft } from '../../../../../lib/services/ai'
import { DraftType } from '../../../../../lib/types/ai'

/**
 * Request body type
 */
type DraftRequest = {
  caseType: string
  draftType: DraftType
  factSummary: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.caseId

    // Verify case belongs to user's firm
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, firm_id')
      .eq('id', caseId)
      .single()

    if (caseError || !caseData) {
      console.error('[draft] Case not found:', caseError)
      return NextResponse.json({ error: 'Dava bulunamadı' }, { status: 404 })
    }

    // Check if user belongs to the same firm
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error('[draft] Profile not found:', profileError)
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 })
    }

    if (caseData.firm_id !== profileData.firm_id) {
      console.error('[draft] Unauthorized access attempt:', {
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

    // Parse request body
    const body: DraftRequest = await request.json()
    const { caseType, draftType, factSummary } = body

    // Validate required fields
    if (!caseType) {
      return NextResponse.json({ error: 'caseType is required' }, { status: 400 })
    }

    if (!draftType) {
      return NextResponse.json({ error: 'draftType is required' }, { status: 400 })
    }

    if (!factSummary || !factSummary.trim()) {
      return NextResponse.json({ error: 'factSummary is required' }, { status: 400 })
    }

    // Validate draftType
    const validDraftTypes: DraftType[] = ['dava_dilekcesi', 'cevap_dilekcesi', 'istinaf', 'temyiz']
    if (!validDraftTypes.includes(draftType)) {
      return NextResponse.json(
        { error: 'Invalid draftType. Must be one of: dava_dilekcesi, cevap_dilekcesi, istinaf, temyiz' },
        { status: 400 }
      )
    }

    console.log('[draft] Generating draft for case:', caseId)
    console.log('[draft] Draft type:', draftType)
    console.log('[draft] Case type:', caseType)

    // Call AI service
    const result = await generateDraft({
      userId: user.id,
      caseId,
      caseType,
      draftType,
      factSummary: factSummary.trim(),
    })

    console.log('[draft] Draft generated successfully')

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[draft] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Dilekçe taslağı oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    )
  }
}

