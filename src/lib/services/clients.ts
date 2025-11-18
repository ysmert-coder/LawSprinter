/**
 * Clients Service
 * 
 * Manages client data, messages, and AI-generated profiles
 */

import { createClient } from '../supabaseServer'

export interface Client {
  id: string
  firm_id: string
  full_name: string
  email: string | null
  phone: string | null
  whatsapp_number: string | null
  type: 'individual' | 'corporate'
  address: string | null
  tax_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientMessage {
  id: string
  firm_id: string
  client_id: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'telegram' | 'email' | 'portal' | 'sms'
  message_text: string
  metadata: any
  read_at: string | null
  created_at: string
}

export interface ClientProfile {
  id: string
  firm_id: string
  client_id: string
  sentiment_score: number | null
  risk_level: 'low' | 'medium' | 'high' | null
  communication_style: string | null
  emotional_state: string | null
  json_profile: any
  last_analysis_at: string
  created_at: string
  updated_at: string
}

/**
 * Get all clients for a user's firm
 */
export async function listClientsForUser(userId: string): Promise<Client[]> {
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

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[listClientsForUser] Error:', error)
      throw new Error(`Failed to fetch clients: ${error.message}`)
    }

    return data as Client[]
  } catch (error) {
    console.error('[listClientsForUser] Exception:', error)
    throw error
  }
}

/**
 * Create a new client
 */
export async function createClient(
  userId: string,
  data: {
    full_name: string
    email?: string
    phone?: string
    whatsapp_number?: string
    type?: 'individual' | 'corporate'
    address?: string
    tax_number?: string
    notes?: string
  }
): Promise<Client> {
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

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        firm_id: profile.firm_id,
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('[createClient] Error:', error)
      throw new Error(`Failed to create client: ${error.message}`)
    }

    console.log('[createClient] Success:', newClient.id)
    return newClient as Client
  } catch (error) {
    console.error('[createClient] Exception:', error)
    throw error
  }
}

/**
 * Get a client by ID
 */
export async function getClientById(userId: string, clientId: string): Promise<Client | null> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return null
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[getClientById] Error:', error)
      throw new Error(`Failed to fetch client: ${error.message}`)
    }

    return data as Client
  } catch (error) {
    console.error('[getClientById] Exception:', error)
    throw error
  }
}

/**
 * Get messages for a client
 */
export async function getClientMessages(
  userId: string,
  clientId: string,
  limit: number = 100
): Promise<ClientMessage[]> {
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

    const { data, error } = await supabase
      .from('client_messages')
      .select('*')
      .eq('client_id', clientId)
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getClientMessages] Error:', error)
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    return data as ClientMessage[]
  } catch (error) {
    console.error('[getClientMessages] Exception:', error)
    throw error
  }
}

/**
 * Add a message for a client
 */
export async function addClientMessage(
  userId: string,
  clientId: string,
  data: {
    direction: 'inbound' | 'outbound'
    channel: 'whatsapp' | 'telegram' | 'email' | 'portal' | 'sms'
    message_text: string
    metadata?: any
  }
): Promise<ClientMessage> {
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

    const { data: newMessage, error } = await supabase
      .from('client_messages')
      .insert({
        firm_id: profile.firm_id,
        client_id: clientId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('[addClientMessage] Error:', error)
      throw new Error(`Failed to add message: ${error.message}`)
    }

    console.log('[addClientMessage] Success:', newMessage.id)
    return newMessage as ClientMessage
  } catch (error) {
    console.error('[addClientMessage] Exception:', error)
    throw error
  }
}

/**
 * Get client profile (AI-generated)
 */
export async function getClientProfile(
  userId: string,
  clientId: string
): Promise<ClientProfile | null> {
  try {
    const supabase = await createClient()

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single()

    if (!profile?.firm_id) {
      return null
    }

    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', clientId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[getClientProfile] Error:', error)
      throw new Error(`Failed to fetch client profile: ${error.message}`)
    }

    return data as ClientProfile
  } catch (error) {
    console.error('[getClientProfile] Exception:', error)
    throw error
  }
}

/**
 * Upsert client profile (create or update)
 */
export async function upsertClientProfile(
  userId: string,
  clientId: string,
  profileData: {
    sentiment_score?: number
    risk_level?: 'low' | 'medium' | 'high'
    communication_style?: string
    emotional_state?: string
    json_profile?: any
  }
): Promise<ClientProfile> {
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

    const { data: upsertedProfile, error } = await supabase
      .from('client_profiles')
      .upsert(
        {
          firm_id: profile.firm_id,
          client_id: clientId,
          ...profileData,
          last_analysis_at: new Date().toISOString(),
        },
        {
          onConflict: 'client_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('[upsertClientProfile] Error:', error)
      throw new Error(`Failed to upsert client profile: ${error.message}`)
    }

    console.log('[upsertClientProfile] Success:', clientId)
    return upsertedProfile as ClientProfile
  } catch (error) {
    console.error('[upsertClientProfile] Exception:', error)
    throw error
  }
}

/**
 * Get clients with case counts
 */
export async function getClientsWithStats(userId: string): Promise<
  Array<
    Client & {
      openCasesCount: number
      totalCasesCount: number
      lastActivityDate: string | null
    }
  >
> {
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

    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        cases (
          id,
          status,
          updated_at
        )
      `)
      .eq('firm_id', profile.firm_id)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[getClientsWithStats] Error:', error)
      throw new Error(`Failed to fetch clients with stats: ${error.message}`)
    }

    // Transform data
    const clientsWithStats = clients?.map((client: any) => {
      const cases = client.cases || []
      const openCases = cases.filter((c: any) => c.status === 'active' || c.status === 'pending')
      const lastActivity = cases.length > 0
        ? cases.reduce((latest: any, c: any) => {
            return !latest || c.updated_at > latest ? c.updated_at : latest
          }, null)
        : null

      return {
        ...client,
        cases: undefined, // Remove nested cases
        openCasesCount: openCases.length,
        totalCasesCount: cases.length,
        lastActivityDate: lastActivity,
      }
    })

    return clientsWithStats || []
  } catch (error) {
    console.error('[getClientsWithStats] Exception:', error)
    throw error
  }
}

