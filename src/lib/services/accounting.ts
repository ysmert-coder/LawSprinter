/**
 * Accounting Service
 * 
 * Manages invoices and payments for legal services
 */

import { createClient } from '../supabaseServer'

export interface Invoice {
  id: string
  firm_id: string
  case_id: string | null
  client_id: string | null
  invoice_number: string | null
  description: string
  amount: number
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  firm_id: string
  invoice_id: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other' | null
  payment_date: string
  notes: string | null
  created_at: string
}

/**
 * Get all invoices for a user's firm
 */
export async function listInvoicesForUser(userId: string): Promise<Invoice[]> {
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
      .from('invoices')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[listInvoicesForUser] Error:', error)
      throw new Error(`Failed to fetch invoices: ${error.message}`)
    }

    return data as Invoice[]
  } catch (error) {
    console.error('[listInvoicesForUser] Exception:', error)
    throw error
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(
  userId: string,
  data: {
    case_id?: string
    client_id?: string
    invoice_number?: string
    description: string
    amount: number
    currency?: 'TRY' | 'USD' | 'EUR' | 'GBP'
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    due_date?: string
    notes?: string
  }
): Promise<Invoice> {
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

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        firm_id: profile.firm_id,
        currency: 'TRY',
        status: 'draft',
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('[createInvoice] Error:', error)
      throw new Error(`Failed to create invoice: ${error.message}`)
    }

    console.log('[createInvoice] Success:', newInvoice.id)
    return newInvoice as Invoice
  } catch (error) {
    console.error('[createInvoice] Exception:', error)
    throw error
  }
}

/**
 * Mark an invoice as paid
 */
export async function markInvoicePaid(
  userId: string,
  invoiceId: string,
  data: {
    amount: number
    payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other'
    payment_date?: string
    notes?: string
  }
): Promise<Invoice> {
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

    // Update invoice status
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: data.payment_date || new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('firm_id', profile.firm_id)
      .select()
      .single()

    if (invoiceError) {
      console.error('[markInvoicePaid] Invoice update error:', invoiceError)
      throw new Error(`Failed to update invoice: ${invoiceError.message}`)
    }

    // Create payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      firm_id: profile.firm_id,
      invoice_id: invoiceId,
      amount: data.amount,
      payment_method: data.payment_method || 'other',
      payment_date: data.payment_date || new Date().toISOString(),
      notes: data.notes,
    })

    if (paymentError) {
      console.error('[markInvoicePaid] Payment insert error:', paymentError)
      // Don't throw here, invoice is already updated
    }

    console.log('[markInvoicePaid] Success:', invoiceId)
    return updatedInvoice as Invoice
  } catch (error) {
    console.error('[markInvoicePaid] Exception:', error)
    throw error
  }
}

/**
 * Get overdue invoices
 */
export async function listOverdueInvoices(
  userId: string,
  referenceDate?: string
): Promise<
  Array<
    Invoice & {
      client_name?: string
      case_title?: string
      days_overdue: number
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

    const refDate = referenceDate || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          full_name
        ),
        cases (
          title
        )
      `)
      .eq('firm_id', profile.firm_id)
      .in('status', ['sent', 'overdue'])
      .lt('due_date', refDate)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('[listOverdueInvoices] Error:', error)
      throw new Error(`Failed to fetch overdue invoices: ${error.message}`)
    }

    // Calculate days overdue
    const today = new Date(refDate)
    const overdueInvoices = data?.map((invoice: any) => {
      const dueDate = new Date(invoice.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...invoice,
        client_name: invoice.clients?.full_name,
        case_title: invoice.cases?.title,
        clients: undefined,
        cases: undefined,
        days_overdue: daysOverdue,
      }
    })

    return overdueInvoices || []
  } catch (error) {
    console.error('[listOverdueInvoices] Exception:', error)
    throw error
  }
}

/**
 * Get accounting summary for dashboard
 */
export async function getAccountingSummary(userId: string): Promise<{
  totalReceivables: { [currency: string]: number }
  collectedThisMonth: { [currency: string]: number }
  overdueCount: number
  overdueAmount: { [currency: string]: number }
}> {
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
        totalReceivables: {},
        collectedThisMonth: {},
        overdueCount: 0,
        overdueAmount: {},
      }
    }

    // Get all unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from('invoices')
      .select('amount, currency, status, due_date')
      .eq('firm_id', profile.firm_id)
      .in('status', ['sent', 'overdue'])

    // Get payments this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount, invoices(currency)')
      .eq('firm_id', profile.firm_id)
      .gte('payment_date', startOfMonth.toISOString())

    // Calculate totals
    const totalReceivables: { [currency: string]: number } = {}
    const overdueAmount: { [currency: string]: number } = {}
    let overdueCount = 0

    unpaidInvoices?.forEach((invoice: any) => {
      const currency = invoice.currency || 'TRY'
      totalReceivables[currency] = (totalReceivables[currency] || 0) + parseFloat(invoice.amount)

      if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
        overdueAmount[currency] = (overdueAmount[currency] || 0) + parseFloat(invoice.amount)
        overdueCount++
      }
    })

    const collectedThisMonth: { [currency: string]: number } = {}
    paymentsThisMonth?.forEach((payment: any) => {
      const currency = payment.invoices?.currency || 'TRY'
      collectedThisMonth[currency] = (collectedThisMonth[currency] || 0) + parseFloat(payment.amount)
    })

    return {
      totalReceivables,
      collectedThisMonth,
      overdueCount,
      overdueAmount,
    }
  } catch (error) {
    console.error('[getAccountingSummary] Exception:', error)
    throw error
  }
}

/**
 * Get invoices with client and case details
 */
export async function getInvoicesWithDetails(userId: string): Promise<
  Array<
    Invoice & {
      client_name?: string
      case_title?: string
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

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          full_name
        ),
        cases (
          title
        )
      `)
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getInvoicesWithDetails] Error:', error)
      throw new Error(`Failed to fetch invoices: ${error.message}`)
    }

    const invoicesWithDetails = data?.map((invoice: any) => ({
      ...invoice,
      client_name: invoice.clients?.full_name,
      case_title: invoice.cases?.title,
      clients: undefined,
      cases: undefined,
    }))

    return invoicesWithDetails || []
  } catch (error) {
    console.error('[getInvoicesWithDetails] Exception:', error)
    throw error
  }
}

