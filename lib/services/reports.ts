/**
 * Reports Service Layer
 * 
 * Provides statistics and analytics for the reports page
 */

import { createClient } from '../../src/lib/supabaseServer'

/**
 * Monthly Case Statistics
 */
export interface MonthlyCaseStats {
  openedThisMonth: number
  closedThisMonth: number
  totalActive: number
}

/**
 * Monthly Finance Statistics
 */
export interface MonthlyFinanceStats {
  invoicedThisMonth: number
  collectedThisMonth: number
  pendingReceivables: number
  currency: string
}

/**
 * Case Distribution by Status
 */
export interface CaseDistributionByStatus {
  status: string
  count: number
  label: string
}

/**
 * Case Distribution by Type
 */
export interface CaseDistributionByType {
  caseType: string
  count: number
  label: string
}

/**
 * Case Distribution
 */
export interface CaseDistribution {
  byStatus: CaseDistributionByStatus[]
  byType: CaseDistributionByType[]
}

/**
 * Monthly Trend Data Point
 */
export interface MonthlyTrendDataPoint {
  month: string // YYYY-MM format
  monthLabel: string // "Oca 2024" format
  casesOpened: number
  casesClosed: number
  collectionAmount: number
}

/**
 * Yearly Trends (last 12 months)
 */
export interface YearlyTrends {
  months: MonthlyTrendDataPoint[]
}

/**
 * Get monthly case statistics
 */
export async function getMonthlyCaseStats(
  userId: string,
  referenceDate: Date = new Date()
): Promise<MonthlyCaseStats> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return {
        openedThisMonth: 0,
        closedThisMonth: 0,
        totalActive: 0,
      }
    }

    // Calculate month boundaries
    const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
    const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59)

    // Get cases opened this month
    const { count: openedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    // Get cases closed this month
    const { count: closedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .in('status', ['closed', 'won', 'archived'])
      .gte('updated_at', startOfMonth.toISOString())
      .lte('updated_at', endOfMonth.toISOString())

    // Get total active cases
    const { count: activeCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .not('status', 'in', '(closed,won,archived)')

    return {
      openedThisMonth: openedCount || 0,
      closedThisMonth: closedCount || 0,
      totalActive: activeCount || 0,
    }
  } catch (error) {
    console.error('[getMonthlyCaseStats] Error:', error)
    throw error
  }
}

/**
 * Get monthly finance statistics
 */
export async function getMonthlyFinanceStats(
  userId: string,
  referenceDate: Date = new Date()
): Promise<MonthlyFinanceStats> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return {
        invoicedThisMonth: 0,
        collectedThisMonth: 0,
        pendingReceivables: 0,
        currency: 'TRY',
      }
    }

    // Calculate month boundaries
    const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
    const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59)

    // Get invoices issued this month (TRY only for simplicity)
    const { data: invoicesThisMonth } = await supabase
      .from('invoices')
      .select('amount, currency')
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .eq('currency', 'TRY')
      .gte('issued_at', startOfMonth.toISOString())
      .lte('issued_at', endOfMonth.toISOString())

    const invoicedThisMonth = invoicesThisMonth?.reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0) || 0

    // Get payments collected this month (TRY only)
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .gte('payment_date', startOfMonth.toISOString())
      .lte('payment_date', endOfMonth.toISOString())

    const collectedThisMonth = paymentsThisMonth?.reduce((sum, pay) => sum + parseFloat(pay.amount as any), 0) || 0

    // Get pending receivables (unpaid/partial invoices, TRY only)
    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select('amount')
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .eq('currency', 'TRY')
      .in('status', ['draft', 'sent', 'partial', 'overdue'])

    const pendingReceivables = pendingInvoices?.reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0) || 0

    return {
      invoicedThisMonth,
      collectedThisMonth,
      pendingReceivables,
      currency: 'TRY',
    }
  } catch (error) {
    console.error('[getMonthlyFinanceStats] Error:', error)
    throw error
  }
}

/**
 * Get case distribution by status and type
 */
export async function getCaseDistribution(userId: string): Promise<CaseDistribution> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return {
        byStatus: [],
        byType: [],
      }
    }

    // Get all cases for the user/firm
    const { data: cases } = await supabase
      .from('cases')
      .select('status, case_type')
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)

    if (!cases || cases.length === 0) {
      return {
        byStatus: [],
        byType: [],
      }
    }

    // Group by status
    const statusMap = new Map<string, number>()
    cases.forEach((c) => {
      const status = c.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const statusLabels: Record<string, string> = {
      active: 'Aktif',
      pending: 'Beklemede',
      closed: 'Kapalı',
      won: 'Kazanıldı',
      lost: 'Kaybedildi',
      archived: 'Arşiv',
      unknown: 'Belirsiz',
    }

    const byStatus: CaseDistributionByStatus[] = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      label: statusLabels[status] || status,
    }))

    // Group by case_type
    const typeMap = new Map<string, number>()
    cases.forEach((c) => {
      const caseType = c.case_type || 'other'
      typeMap.set(caseType, (typeMap.get(caseType) || 0) + 1)
    })

    const typeLabels: Record<string, string> = {
      criminal: 'Ceza',
      civil: 'Hukuk',
      commercial: 'Ticaret',
      labor: 'İş',
      family: 'Aile',
      real_estate: 'Gayrimenkul',
      enforcement: 'İcra & İflas',
      administrative: 'İdari',
      other: 'Diğer',
    }

    const byType: CaseDistributionByType[] = Array.from(typeMap.entries()).map(([caseType, count]) => ({
      caseType,
      count,
      label: typeLabels[caseType] || caseType,
    }))

    return {
      byStatus,
      byType,
    }
  } catch (error) {
    console.error('[getCaseDistribution] Error:', error)
    throw error
  }
}

/**
 * Get yearly trends (last 12 months)
 */
export async function getYearlyTrends(userId: string): Promise<YearlyTrends> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return { months: [] }
    }

    // Calculate last 12 months
    const now = new Date()
    const months: MonthlyTrendDataPoint[] = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })

      // Cases opened this month
      const { count: openedCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

      // Cases closed this month
      const { count: closedCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
        .in('status', ['closed', 'won', 'archived'])
        .gte('updated_at', startOfMonth.toISOString())
        .lte('updated_at', endOfMonth.toISOString())

      // Payments collected this month (TRY only)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
        .gte('payment_date', startOfMonth.toISOString())
        .lte('payment_date', endOfMonth.toISOString())

      const collectionAmount = payments?.reduce((sum, pay) => sum + parseFloat(pay.amount as any), 0) || 0

      months.push({
        month: monthKey,
        monthLabel,
        casesOpened: openedCount || 0,
        casesClosed: closedCount || 0,
        collectionAmount,
      })
    }

    return { months }
  } catch (error) {
    console.error('[getYearlyTrends] Error:', error)
    throw error
  }
}

