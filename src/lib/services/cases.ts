import { createClient } from '../supabaseServer'
import { Database, InsertDto, Case } from '@/types/database'

type CaseInsert = InsertDto<'cases'>

/**
 * Get all cases for a firm
 */
export async function getFirmCases(firmId: string): Promise<Case[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        clients (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getFirmCases] Error:', error)
      throw new Error(`Failed to fetch cases: ${error.message}`)
    }

    return data as Case[]
  } catch (error) {
    console.error('[getFirmCases] Exception:', error)
    throw error
  }
}

/**
 * Create a new case
 */
export async function createCase(
  firmId: string,
  data: {
    client_id: string
    title: string
    type: Database['public']['Enums']['case_type']
    description?: string
    case_number?: string
    status?: Database['public']['Enums']['case_status']
  }
): Promise<Case> {
  try {
    const supabase = await createClient()

    const caseData: CaseInsert = {
      firm_id: firmId,
      client_id: data.client_id,
      title: data.title,
      type: data.type,
      description: data.description,
      case_number: data.case_number,
      status: data.status || 'active',
    }

    const { data: newCase, error } = await supabase
      .from('cases')
      .insert(caseData)
      .select()
      .single()

    if (error) {
      console.error('[createCase] Error:', error)
      throw new Error(`Failed to create case: ${error.message}`)
    }

    console.log('[createCase] Success:', newCase.id)
    return newCase
  } catch (error) {
    console.error('[createCase] Exception:', error)
    throw error
  }
}

/**
 * Get a single case by ID
 */
export async function getCaseById(
  firmId: string,
  caseId: string
): Promise<Case | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        clients (
          id,
          full_name,
          email,
          phone,
          address
        ),
        tasks (
          id,
          title,
          status,
          priority,
          due_date
        ),
        deadlines (
          id,
          type,
          description,
          date,
          critical_level,
          completed
        ),
        documents (
          id,
          title,
          type,
          storage_path,
          created_at
        )
      `)
      .eq('id', caseId)
      .eq('firm_id', firmId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('[getCaseById] Error:', error)
      throw new Error(`Failed to fetch case: ${error.message}`)
    }

    return data as Case
  } catch (error) {
    console.error('[getCaseById] Exception:', error)
    throw error
  }
}

/**
 * Update case status
 */
export async function updateCaseStatus(
  firmId: string,
  caseId: string,
  status: Database['public']['Enums']['case_status']
): Promise<Case> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', caseId)
      .eq('firm_id', firmId)
      .select()
      .single()

    if (error) {
      console.error('[updateCaseStatus] Error:', error)
      throw new Error(`Failed to update case status: ${error.message}`)
    }

    console.log('[updateCaseStatus] Success:', caseId)
    return data
  } catch (error) {
    console.error('[updateCaseStatus] Exception:', error)
    throw error
  }
}

/**
 * Get cases by status
 */
export async function getCasesByStatus(
  firmId: string,
  status: Database['public']['Enums']['case_status']
): Promise<Case[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        clients (
          id,
          full_name
        )
      `)
      .eq('firm_id', firmId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getCasesByStatus] Error:', error)
      throw new Error(`Failed to fetch cases by status: ${error.message}`)
    }

    return data as Case[]
  } catch (error) {
    console.error('[getCasesByStatus] Exception:', error)
    throw error
  }
}

/**
 * Get all cases for a user (via their firm)
 */
export async function listCasesForUser(userId: string): Promise<Case[]> {
  try {
    const supabase = await createClient()

    // First get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return []
    }

    return await getFirmCases(profile.firm_id)
  } catch (error) {
    console.error('[listCasesForUser] Exception:', error)
    throw error
  }
}

/**
 * Update a case
 */
export async function updateCase(
  userId: string,
  caseId: string,
  data: Partial<{
    title: string
    type: Database['public']['Enums']['case_type']
    status: Database['public']['Enums']['case_status']
    description: string
    case_number: string
  }>
): Promise<Case> {
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

    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update(data)
      .eq('id', caseId)
      .eq('firm_id', profile.firm_id)
      .select()
      .single()

    if (error) {
      console.error('[updateCase] Error:', error)
      throw new Error(`Failed to update case: ${error.message}`)
    }

    console.log('[updateCase] Success:', caseId)
    return updatedCase
  } catch (error) {
    console.error('[updateCase] Exception:', error)
    throw error
  }
}

/**
 * Archive a case
 */
export async function archiveCase(userId: string, caseId: string): Promise<Case> {
  return await updateCase(userId, caseId, { status: 'archived' })
}

/**
 * Get case status distribution for dashboard
 */
export async function getCaseStatusDistribution(firmId: string): Promise<{
  active: number
  pending: number
  closed: number
  archived: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cases')
      .select('status')
      .eq('firm_id', firmId)

    if (error) {
      console.error('[getCaseStatusDistribution] Error:', error)
      throw new Error(`Failed to fetch case distribution: ${error.message}`)
    }

    const distribution = {
      active: 0,
      pending: 0,
      closed: 0,
      archived: 0,
    }

    data?.forEach((c: any) => {
      if (c.status in distribution) {
        distribution[c.status as keyof typeof distribution]++
      }
    })

    return distribution
  } catch (error) {
    console.error('[getCaseStatusDistribution] Exception:', error)
    throw error
  }
}

/**
 * Get monthly case statistics
 */
export async function getMonthlyCaseStats(firmId: string): Promise<{
  openedThisMonth: number
  closedThisMonth: number
}> {
  try {
    const supabase = await createClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Cases opened this month
    const { data: openedCases, error: openedError } = await supabase
      .from('cases')
      .select('id')
      .eq('firm_id', firmId)
      .gte('created_at', startOfMonth.toISOString())

    if (openedError) {
      console.error('[getMonthlyCaseStats] Opened error:', openedError)
    }

    // Cases closed this month
    const { data: closedCases, error: closedError } = await supabase
      .from('cases')
      .select('id, updated_at')
      .eq('firm_id', firmId)
      .eq('status', 'closed')
      .gte('updated_at', startOfMonth.toISOString())

    if (closedError) {
      console.error('[getMonthlyCaseStats] Closed error:', closedError)
    }

    return {
      openedThisMonth: openedCases?.length || 0,
      closedThisMonth: closedCases?.length || 0,
    }
  } catch (error) {
    console.error('[getMonthlyCaseStats] Exception:', error)
    throw error
  }
}

