import { createClient } from '../supabaseServer'
import { Database, InsertDto, Contract, Document } from '@/types/database'

type ContractInsert = InsertDto<'contracts'>
type DocumentInsert = InsertDto<'documents'>

/**
 * Create a contract with associated document
 * First creates document record, then creates contract with document_id
 */
export async function createContractWithDocument(
  firmId: string,
  caseId: string,
  data: {
    title: string
    type: Database['public']['Enums']['document_type']
    storage_path: string
    file_size?: number
    mime_type?: string
  }
): Promise<{ contract: Contract; document: Document }> {
  try {
    const supabase = await createClient()

    // Step 1: Create document
    const documentData: DocumentInsert = {
      firm_id: firmId,
      case_id: caseId,
      title: data.title,
      type: data.type,
      storage_path: data.storage_path,
      file_size: data.file_size,
      mime_type: data.mime_type,
    }

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (docError) {
      console.error('[createContractWithDocument] Document error:', docError)
      throw new Error(`Failed to create document: ${docError.message}`)
    }

    console.log('[createContractWithDocument] Document created:', document.id)

    // Step 2: Create contract with document_id
    const contractData: ContractInsert = {
      firm_id: firmId,
      case_id: caseId,
      document_id: document.id,
      title: data.title,
      status: 'active',
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single()

    if (contractError) {
      console.error('[createContractWithDocument] Contract error:', contractError)
      // Rollback: delete document if contract creation fails
      await supabase.from('documents').delete().eq('id', document.id)
      throw new Error(`Failed to create contract: ${contractError.message}`)
    }

    console.log('[createContractWithDocument] Contract created:', contract.id)

    return { contract, document }
  } catch (error) {
    console.error('[createContractWithDocument] Exception:', error)
    throw error
  }
}

/**
 * Update contract with AI analysis results
 */
export async function updateContractAnalysis(
  contractId: string,
  analysis: {
    expiry_date?: string | null
    notice_period_days?: number | null
    risk_score?: number | null
    summary_for_lawyer?: string | null
    summary_for_client?: string | null
  }
): Promise<Contract> {
  try {
    const supabase = await createClient()

    // Determine status based on expiry_date
    let status: Database['public']['Enums']['contract_status'] = 'active'
    if (analysis.expiry_date) {
      const expiryDate = new Date(analysis.expiry_date)
      const today = new Date()
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilExpiry < 0) {
        status = 'expired'
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon'
      }
    }

    const { data, error } = await supabase
      .from('contracts')
      .update({
        expiry_date: analysis.expiry_date,
        notice_period_days: analysis.notice_period_days,
        risk_score: analysis.risk_score,
        summary_for_lawyer: analysis.summary_for_lawyer,
        summary_for_client: analysis.summary_for_client,
        status,
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('[updateContractAnalysis] Error:', error)
      throw new Error(`Failed to update contract analysis: ${error.message}`)
    }

    console.log('[updateContractAnalysis] Success:', contractId)
    return data
  } catch (error) {
    console.error('[updateContractAnalysis] Exception:', error)
    throw error
  }
}

/**
 * Get contracts expiring soon
 */
export async function getExpiringContracts(
  firmId: string,
  daysAhead: number = 30
): Promise<Contract[]> {
  try {
    const supabase = await createClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        cases (
          id,
          title,
          case_number
        ),
        documents (
          id,
          title,
          storage_path
        )
      `)
      .eq('firm_id', firmId)
      .in('status', ['active', 'expiring_soon'])
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('[getExpiringContracts] Error:', error)
      throw new Error(`Failed to fetch expiring contracts: ${error.message}`)
    }

    return data as Contract[]
  } catch (error) {
    console.error('[getExpiringContracts] Exception:', error)
    throw error
  }
}

/**
 * Get contract by ID with related data
 */
export async function getContractById(
  firmId: string,
  contractId: string
): Promise<Contract | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contracts')
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
        ),
        documents (
          id,
          title,
          type,
          storage_path,
          file_size,
          mime_type,
          ai_summary
        )
      `)
      .eq('id', contractId)
      .eq('firm_id', firmId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[getContractById] Error:', error)
      throw new Error(`Failed to fetch contract: ${error.message}`)
    }

    return data as Contract
  } catch (error) {
    console.error('[getContractById] Exception:', error)
    throw error
  }
}

/**
 * Update contract status
 */
export async function updateContractStatus(
  contractId: string,
  status: Database['public']['Enums']['contract_status']
): Promise<Contract> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('[updateContractStatus] Error:', error)
      throw new Error(`Failed to update contract status: ${error.message}`)
    }

    console.log('[updateContractStatus] Success:', contractId)
    return data
  } catch (error) {
    console.error('[updateContractStatus] Exception:', error)
    throw error
  }
}

/**
 * List all tracked contracts for a user
 */
export async function listTrackedContracts(userId: string): Promise<Contract[]> {
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
      .from('contracts')
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
      .eq('firm_id', profile.firm_id)
      .order('expiry_date', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('[listTrackedContracts] Error:', error)
      throw new Error(`Failed to fetch contracts: ${error.message}`)
    }

    return data as Contract[]
  } catch (error) {
    console.error('[listTrackedContracts] Exception:', error)
    throw error
  }
}

/**
 * Create a contract (user-scoped)
 */
export async function createContract(
  userId: string,
  data: {
    case_id?: string
    title: string
    expiry_date?: string
    notice_period_days?: number
    status?: Database['public']['Enums']['contract_status']
  }
): Promise<Contract> {
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

    const { data: newContract, error } = await supabase
      .from('contracts')
      .insert({
        firm_id: profile.firm_id,
        ...data,
        status: data.status || 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('[createContract] Error:', error)
      throw new Error(`Failed to create contract: ${error.message}`)
    }

    console.log('[createContract] Success:', newContract.id)
    return newContract as Contract
  } catch (error) {
    console.error('[createContract] Exception:', error)
    throw error
  }
}

/**
 * Get firm's expiring contracts (for dashboard)
 */
export async function getFirmExpiringContracts(firmId: string): Promise<Contract[]> {
  return await getExpiringContracts(firmId, 60) // Next 60 days
}

