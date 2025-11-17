/**
 * Case Events Service
 * 
 * Manages case events and client-facing activities
 */

import { createClient } from '@/lib/supabaseServer'
import { Database, InsertDto } from '@/types/database'

type CaseEventInsert = InsertDto<'case_events'>

export interface CaseEvent {
  id: string
  firm_id: string
  case_id: string
  title: string
  description: string | null
  event_date: string
  visible_to_client: boolean
  client_message: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a case event
 */
export async function createCaseEvent(
  firmId: string,
  caseId: string,
  data: {
    title: string
    description?: string
    event_date?: string
    visible_to_client?: boolean
  }
): Promise<CaseEvent> {
  try {
    const supabase = await createClient()

    const eventData: CaseEventInsert = {
      firm_id: firmId,
      case_id: caseId,
      title: data.title,
      description: data.description,
      event_date: data.event_date || new Date().toISOString().split('T')[0],
      visible_to_client: data.visible_to_client ?? true,
    }

    const { data: newEvent, error } = await supabase
      .from('case_events')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('[createCaseEvent] Error:', error)
      throw new Error(`Failed to create case event: ${error.message}`)
    }

    console.log('[createCaseEvent] Success:', newEvent.id)
    return newEvent as CaseEvent
  } catch (error) {
    console.error('[createCaseEvent] Exception:', error)
    throw error
  }
}

/**
 * Mark event with client message
 */
export async function markEventClientMessage(
  caseEventId: string,
  clientMessage: string
): Promise<CaseEvent> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('case_events')
      .update({ client_message: clientMessage })
      .eq('id', caseEventId)
      .select()
      .single()

    if (error) {
      console.error('[markEventClientMessage] Error:', error)
      throw new Error(`Failed to update case event: ${error.message}`)
    }

    console.log('[markEventClientMessage] Success:', caseEventId)
    return data as CaseEvent
  } catch (error) {
    console.error('[markEventClientMessage] Exception:', error)
    throw error
  }
}

/**
 * Get pending client events (for dashboard)
 */
export async function getFirmPendingClientEvents(firmId: string): Promise<CaseEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('case_events')
      .select(`
        *,
        cases (
          id,
          title,
          clients (
            id,
            full_name
          )
        )
      `)
      .eq('firm_id', firmId)
      .eq('visible_to_client', true)
      .is('client_message', null)
      .order('event_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[getFirmPendingClientEvents] Error:', error)
      throw new Error(`Failed to fetch pending client events: ${error.message}`)
    }

    return data as CaseEvent[]
  } catch (error) {
    console.error('[getFirmPendingClientEvents] Exception:', error)
    throw error
  }
}

/**
 * Get case events for a specific case
 */
export async function getCaseEvents(firmId: string, caseId: string): Promise<CaseEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('case_events')
      .select('*')
      .eq('firm_id', firmId)
      .eq('case_id', caseId)
      .order('event_date', { ascending: false })

    if (error) {
      console.error('[getCaseEvents] Error:', error)
      throw new Error(`Failed to fetch case events: ${error.message}`)
    }

    return data as CaseEvent[]
  } catch (error) {
    console.error('[getCaseEvents] Exception:', error)
    throw error
  }
}
