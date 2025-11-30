/**
 * Billing Status API Route
 * 
 * Returns current billing status for the authenticated user's firm
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { getFirmForUser, getBillingStatus } from '../../../../lib/services/billing'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get firm
    const firm = await getFirmForUser(user.id)
    if (!firm) {
      return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
    }

    // Get billing status
    const status = await getBillingStatus(firm.id)

    return NextResponse.json(status, { status: 200 })
  } catch (error: any) {
    console.error('[API/billing/status] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch billing status',
      },
      { status: 500 }
    )
  }
}

