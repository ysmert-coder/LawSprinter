import { createClient } from '@/lib/supabaseServer'
import { InsertDto, DailySummary } from '@/types/database'

type DailySummaryInsert = InsertDto<'daily_summaries'>

/**
 * Upsert (insert or update) a daily summary
 * Uses ON CONFLICT to handle unique constraint on (firm_id, summary_date)
 */
export async function upsertDailySummary(
  firmId: string,
  date: string,
  content: string
): Promise<DailySummary> {
  try {
    const supabase = await createClient()

    const summaryData: DailySummaryInsert = {
      firm_id: firmId,
      summary_date: date,
      content: content,
    }

    const { data, error } = await supabase
      .from('daily_summaries')
      .upsert(summaryData, {
        onConflict: 'firm_id,summary_date',
      })
      .select()
      .single()

    if (error) {
      console.error('[upsertDailySummary] Error:', error)
      throw new Error(`Failed to upsert daily summary: ${error.message}`)
    }

    console.log('[upsertDailySummary] Success:', date)
    return data
  } catch (error) {
    console.error('[upsertDailySummary] Exception:', error)
    throw error
  }
}

/**
 * Get the latest daily summary for a firm
 */
export async function getLatestSummary(
  firmId: string
): Promise<DailySummary | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('firm_id', firmId)
      .order('summary_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[getLatestSummary] Error:', error)
      throw new Error(`Failed to fetch latest summary: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('[getLatestSummary] Exception:', error)
    throw error
  }
}

/**
 * Get daily summary for a specific date
 */
export async function getSummaryByDate(
  firmId: string,
  date: string
): Promise<DailySummary | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('firm_id', firmId)
      .eq('summary_date', date)
      .maybeSingle()

    if (error) {
      console.error('[getSummaryByDate] Error:', error)
      throw new Error(`Failed to fetch summary by date: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('[getSummaryByDate] Exception:', error)
    throw error
  }
}

/**
 * Get summaries within a date range
 */
export async function getSummariesByDateRange(
  firmId: string,
  fromDate: string,
  toDate: string
): Promise<DailySummary[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('firm_id', firmId)
      .gte('summary_date', fromDate)
      .lte('summary_date', toDate)
      .order('summary_date', { ascending: false })

    if (error) {
      console.error('[getSummariesByDateRange] Error:', error)
      throw new Error(`Failed to fetch summaries by date range: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('[getSummariesByDateRange] Exception:', error)
    throw error
  }
}

/**
 * Get recent summaries (last N days)
 */
export async function getRecentSummaries(
  firmId: string,
  days: number = 7
): Promise<DailySummary[]> {
  try {
    const supabase = await createClient()

    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - days)

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('firm_id', firmId)
      .gte('summary_date', pastDate.toISOString().split('T')[0])
      .order('summary_date', { ascending: false })

    if (error) {
      console.error('[getRecentSummaries] Error:', error)
      throw new Error(`Failed to fetch recent summaries: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('[getRecentSummaries] Exception:', error)
    throw error
  }
}

/**
 * Delete a daily summary
 */
export async function deleteDailySummary(
  firmId: string,
  date: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('daily_summaries')
      .delete()
      .eq('firm_id', firmId)
      .eq('summary_date', date)

    if (error) {
      console.error('[deleteDailySummary] Error:', error)
      throw new Error(`Failed to delete daily summary: ${error.message}`)
    }

    console.log('[deleteDailySummary] Success:', date)
  } catch (error) {
    console.error('[deleteDailySummary] Exception:', error)
    throw error
  }
}

/**
 * Get summary statistics
 */
export async function getSummaryStats(firmId: string): Promise<{
  total: number
  lastSummaryDate: string | null
  oldestSummaryDate: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('summary_date')
      .eq('firm_id', firmId)
      .order('summary_date', { ascending: false })

    if (error) {
      console.error('[getSummaryStats] Error:', error)
      throw new Error(`Failed to fetch summary stats: ${error.message}`)
    }

    return {
      total: data.length,
      lastSummaryDate: data.length > 0 ? data[0].summary_date : null,
      oldestSummaryDate: data.length > 0 ? data[data.length - 1].summary_date : null,
    }
  } catch (error) {
    console.error('[getSummaryStats] Exception:', error)
    throw error
  }
}

