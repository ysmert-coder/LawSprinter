import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (!profile?.firm_id) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      caseId,
      contractType,
      startDate,
      expiryDate,
      autoRenewal,
      renewalNoticeDays,
      notes,
    } = body

    // Validate required fields
    if (!caseId || !contractType || !startDate || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify case belongs to user's firm
    const { data: caseData } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found or unauthorized' },
        { status: 403 }
      )
    }

    // Insert contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        firm_id: profile.firm_id,
        case_id: caseId,
        contract_type: contractType,
        start_date: startDate,
        expiry_date: expiryDate,
        auto_renewal: autoRenewal || false,
        renewal_notice_days: renewalNoticeDays ? parseInt(renewalNoticeDays) : 30,
        notes: notes || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/contracts] Error:', error)
      return NextResponse.json(
        { error: 'Failed to create contract' },
        { status: 500 }
      )
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('[POST /api/contracts] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

