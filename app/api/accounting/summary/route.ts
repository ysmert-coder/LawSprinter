import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { getSimplifiedAccountingSummary } from '../../../../lib/services/accounting'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get accounting summary
    const summary = await getSimplifiedAccountingSummary(user.id)

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('[accounting/summary] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch accounting summary',
      },
      { status: 500 }
    )
  }
}

