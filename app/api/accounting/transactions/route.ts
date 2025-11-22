import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { getRecentTransactions } from '../../../../lib/services/accounting'

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

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    // Get recent transactions
    const transactions = await getRecentTransactions(user.id, limit)

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('[accounting/transactions] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}

