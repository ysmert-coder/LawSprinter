import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import {
  getMonthlyCaseStats,
  getMonthlyFinanceStats,
  getCaseDistribution,
  getYearlyTrends,
} from '../../../../lib/services/reports'

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

    // Fetch all report data in parallel
    const [monthlyCases, monthlyFinance, caseDistribution, yearlyTrends] = await Promise.all([
      getMonthlyCaseStats(user.id),
      getMonthlyFinanceStats(user.id),
      getCaseDistribution(user.id),
      getYearlyTrends(user.id),
    ])

    return NextResponse.json({
      monthlyCases,
      monthlyFinance,
      caseDistribution,
      yearlyTrends,
    })
  } catch (error: any) {
    console.error('[API/reports/overview] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch report data',
      },
      { status: 500 }
    )
  }
}

