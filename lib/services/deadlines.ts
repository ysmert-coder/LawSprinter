import { createClient } from '@/lib/supabaseServer'
import { Database, InsertDto, Deadline } from '@/types/database'

type DeadlineInsert = InsertDto<'deadlines'>

/**
 * Create a new deadline
 */
export async function createDeadline(
  firmId: string,
  caseId: string,
  data: {
    type: Database['public']['Enums']['deadline_type']
    description: string
    date: string
    critical_level?: Database['public']['Enums']['task_priority']
  }
): Promise<Deadline> {
  try {
    const supabase = await createClient()

    const deadlineData: DeadlineInsert = {
      firm_id: firmId,
      case_id: caseId,
      type: data.type,
      description: data.description,
      date: data.date,
      critical_level: data.critical_level || 'medium',
      completed: false,
    }

    const { data: deadline, error } = await supabase
      .from('deadlines')
      .insert(deadlineData)
      .select()
      .single()

    if (error) {
      console.error('[createDeadline] Error:', error)
      throw new Error(`Failed to create deadline: ${error.message}`)
    }

    console.log('[createDeadline] Success:', deadline.id)
    return deadline
  } catch (error) {
    console.error('[createDeadline] Exception:', error)
    throw error
  }
}

/**
 * Get upcoming deadlines within a date range
 */
export async function getUpcomingDeadlines(
  firmId: string,
  fromDate: string,
  toDate: string
): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deadlines')
      .select(`
        *,
        cases (
          id,
          title,
          case_number,
          type,
          clients (
            id,
            full_name
          )
        )
      `)
      .eq('firm_id', firmId)
      .eq('completed', false)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true })
      .order('critical_level', { ascending: false })

    if (error) {
      console.error('[getUpcomingDeadlines] Error:', error)
      throw new Error(`Failed to fetch upcoming deadlines: ${error.message}`)
    }

    return data as Deadline[]
  } catch (error) {
    console.error('[getUpcomingDeadlines] Exception:', error)
    throw error
  }
}

/**
 * Get critical deadlines (high and critical priority)
 */
export async function getCriticalDeadlines(
  firmId: string,
  daysAhead: number = 7
): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('deadlines')
      .select(`
        *,
        cases (
          id,
          title,
          case_number,
          clients (
            id,
            full_name
          )
        )
      `)
      .eq('firm_id', firmId)
      .eq('completed', false)
      .in('critical_level', ['high', 'critical'])
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', futureDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) {
      console.error('[getCriticalDeadlines] Error:', error)
      throw new Error(`Failed to fetch critical deadlines: ${error.message}`)
    }

    return data as Deadline[]
  } catch (error) {
    console.error('[getCriticalDeadlines] Exception:', error)
    throw error
  }
}

/**
 * Mark deadline as completed
 */
export async function markDeadlineCompleted(
  firmId: string,
  deadlineId: string
): Promise<Deadline> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deadlines')
      .update({ completed: true })
      .eq('id', deadlineId)
      .eq('firm_id', firmId)
      .select()
      .single()

    if (error) {
      console.error('[markDeadlineCompleted] Error:', error)
      throw new Error(`Failed to mark deadline as completed: ${error.message}`)
    }

    console.log('[markDeadlineCompleted] Success:', deadlineId)
    return data
  } catch (error) {
    console.error('[markDeadlineCompleted] Exception:', error)
    throw error
  }
}

/**
 * Get overdue deadlines
 */
export async function getOverdueDeadlines(firmId: string): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('deadlines')
      .select(`
        *,
        cases (
          id,
          title,
          case_number,
          clients (
            id,
            full_name
          )
        )
      `)
      .eq('firm_id', firmId)
      .eq('completed', false)
      .lt('date', today)
      .order('date', { ascending: true })

    if (error) {
      console.error('[getOverdueDeadlines] Error:', error)
      throw new Error(`Failed to fetch overdue deadlines: ${error.message}`)
    }

    return data as Deadline[]
  } catch (error) {
    console.error('[getOverdueDeadlines] Exception:', error)
    throw error
  }
}

/**
 * Get deadlines for a specific case
 */
export async function getCaseDeadlines(
  firmId: string,
  caseId: string
): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('firm_id', firmId)
      .eq('case_id', caseId)
      .order('date', { ascending: true })

    if (error) {
      console.error('[getCaseDeadlines] Error:', error)
      throw new Error(`Failed to fetch case deadlines: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('[getCaseDeadlines] Exception:', error)
    throw error
  }
}

/**
 * List upcoming deadlines for a user (via their firm)
 */
export async function listUpcomingDeadlines(
  userId: string,
  daysAhead: number = 30
): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return []
    }

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    return await getUpcomingDeadlines(
      profile.firm_id,
      today.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0]
    )
  } catch (error) {
    console.error('[listUpcomingDeadlines] Exception:', error)
    throw error
  }
}

/**
 * List deadlines for a specific case (user-scoped)
 */
export async function listDeadlinesForCase(
  userId: string,
  caseId: string
): Promise<Deadline[]> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return []
    }

    return await getCaseDeadlines(profile.firm_id, caseId)
  } catch (error) {
    console.error('[listDeadlinesForCase] Exception:', error)
    throw error
  }
}

/**
 * Complete a deadline (user-scoped)
 */
export async function completeDeadline(userId: string, deadlineId: string): Promise<Deadline> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      throw new Error('User firm not found')
    }

    return await markDeadlineCompleted(profile.firm_id, deadlineId)
  } catch (error) {
    console.error('[completeDeadline] Exception:', error)
    throw error
  }
}

/**
 * Get firm's critical deadlines (for dashboard)
 */
export async function getFirmCriticalDeadlines(firmId: string): Promise<Deadline[]> {
  return await getCriticalDeadlines(firmId, 2) // Next 2 days
}

/**
 * Get firm's upcoming deadlines (for dashboard)
 */
export async function getFirmUpcomingDeadlines(firmId: string): Promise<Deadline[]> {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + 14) // Next 14 days

  return await getUpcomingDeadlines(
    firmId,
    today.toISOString().split('T')[0],
    futureDate.toISOString().split('T')[0]
  )
}

