/**
 * Accounting Service
 * 
 * Manages invoices and payments for legal services
 */

import { createClient } from '../../src/lib/supabaseServer'
import type { 
  Invoice, 
  Payment, 
  InvoiceWithRelations, 
  AccountingSummary,
  InvoiceInstallment,
  InvoiceInstallmentInput,
  InstallmentStatus,
  InstallmentSummary,
  Currency
} from '../../types/database'

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrency(amount: number, currency: Currency = 'TRY'): string {
  const currencyConfig: Record<Currency, { locale: string; currency: string; symbol: string }> = {
    TRY: { locale: 'tr-TR', currency: 'TRY', symbol: '₺' },
    USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
    EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
    GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  }

  const config = currencyConfig[currency] || currencyConfig.TRY

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount)
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'TRY'): string {
  const symbols: Record<Currency, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  return symbols[currency] || '₺'
}

// Types are imported from types/database.ts

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

/**
 * List payments for a specific invoice
 */
export async function listPaymentsForInvoice(
  userId: string,
  invoiceId: string
): Promise<Payment[]> {
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
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('firm_id', profile.firm_id)
      .order('paid_at', { ascending: false })

    if (error) {
      console.error('[listPaymentsForInvoice] Error:', error)
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    return data as Payment[]
  } catch (error) {
    console.error('[listPaymentsForInvoice] Exception:', error)
    throw error
  }
}

/**
 * Add payment to invoice (supports partial payments)
 */
export async function addPaymentToInvoice(
  userId: string,
  invoiceId: string,
  paymentData: {
    amount: number
    paid_at?: string
    payment_method?: Payment['payment_method']
    notes?: string
  }
): Promise<Payment> {
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

    // Verify invoice exists and belongs to user's firm
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, amount, status')
      .eq('id', invoiceId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Create payment record
    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        firm_id: profile.firm_id,
        user_id: userId,
        invoice_id: invoiceId,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method || 'other',
        paid_at: paymentData.paid_at || new Date().toISOString(),
        notes: paymentData.notes,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('[addPaymentToInvoice] Error:', paymentError)
      throw new Error(`Failed to add payment: ${paymentError.message}`)
    }

    console.log('[addPaymentToInvoice] Success:', newPayment.id)
    // Note: Invoice status will be automatically updated by database trigger
    return newPayment as Payment
  } catch (error) {
    console.error('[addPaymentToInvoice] Exception:', error)
    throw error
  }
}

/**
 * Get invoice with full details including client, case, and payments
 */
export async function getInvoiceWithDetails(
  userId: string,
  invoiceId: string
): Promise<InvoiceWithRelations | null> {
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
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          full_name,
          email
        ),
        cases (
          id,
          title,
          case_number
        )
      `)
      .eq('id', invoiceId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (error) {
      console.error('[getInvoiceWithDetails] Error:', error)
      throw new Error(`Failed to fetch invoice: ${error.message}`)
    }

    // Get payments for this invoice
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: false })

    const invoiceWithDetails: InvoiceWithRelations = {
      ...data,
      client: data.clients ? {
        id: data.clients.id,
        full_name: data.clients.full_name,
        email: data.clients.email,
      } : null,
      case: data.cases ? {
        id: data.cases.id,
        title: data.cases.title,
        case_number: data.cases.case_number,
      } : null,
      payments: payments as Payment[] || [],
    }

    // Remove nested objects
    delete (invoiceWithDetails as any).clients
    delete (invoiceWithDetails as any).cases

    return invoiceWithDetails
  } catch (error) {
    console.error('[getInvoiceWithDetails] Exception:', error)
    throw error
  }
}

/**
 * Get recent transactions (payments) for display
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 30
): Promise<Array<Payment & { invoice?: { description: string; client_name?: string; case_title?: string } }>> {
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

    // Get payments from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices (
          description,
          clients (
            full_name
          ),
          cases (
            title
          )
        )
      `)
      .eq('firm_id', profile.firm_id)
      .gte('paid_at', thirtyDaysAgo.toISOString())
      .order('paid_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getRecentTransactions] Error:', error)
      throw new Error(`Failed to fetch transactions: ${error.message}`)
    }

    const transactions = data?.map((payment: any) => ({
      ...payment,
      invoice: payment.invoices ? {
        description: payment.invoices.description,
        client_name: payment.invoices.clients?.full_name,
        case_title: payment.invoices.cases?.title,
      } : undefined,
      invoices: undefined,
    }))

    return transactions || []
  } catch (error) {
    console.error('[getRecentTransactions] Exception:', error)
    throw error
  }
}

/**
 * Get simplified accounting summary using database function
 */
export async function getSimplifiedAccountingSummary(
  userId: string
): Promise<AccountingSummary> {
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
        totalReceivable: 0,
        monthCollected: 0,
        overdueCount: 0,
        overdueTotal: 0,
      }
    }

    // Call database function
    const { data, error } = await supabase
      .rpc('get_accounting_summary', {
        p_user_id: userId,
        p_firm_id: profile.firm_id,
      })

    if (error) {
      console.error('[getSimplifiedAccountingSummary] Error:', error)
      // Fallback to manual calculation
      return await calculateSummaryManually(userId, profile.firm_id, supabase)
    }

    return data as AccountingSummary
  } catch (error) {
    console.error('[getSimplifiedAccountingSummary] Exception:', error)
    throw error
  }
}

/**
 * Fallback manual calculation for accounting summary
 */
async function calculateSummaryManually(
  userId: string,
  firmId: string,
  supabase: any
): Promise<AccountingSummary> {
  // Get unpaid/partial invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date')
    .eq('firm_id', firmId)
    .in('status', ['sent', 'partial', 'overdue'])

  // Calculate total receivable
  let totalReceivable = 0
  let overdueCount = 0
  let overdueTotal = 0
  const today = new Date()

  for (const invoice of invoices || []) {
    // Get payments for this invoice
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', invoice.id)

    const paidAmount = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0
    const remaining = parseFloat(invoice.amount) - paidAmount

    if (remaining > 0) {
      totalReceivable += remaining

      if (invoice.due_date && new Date(invoice.due_date) < today) {
        overdueCount++
        overdueTotal += remaining
      }
    }
  }

  // Get this month's payments
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('firm_id', firmId)
    .gte('paid_at', startOfMonth.toISOString())

  const monthCollected = monthPayments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0

  return {
    totalReceivable,
    monthCollected,
    overdueCount,
    overdueTotal,
  }
}

/**
 * ========================================
 * INSTALLMENT FUNCTIONS
 * ========================================
 */

/**
 * List all installments for a specific invoice
 */
export async function listInstallmentsForInvoice(
  userId: string,
  invoiceId: string
): Promise<InvoiceInstallment[]> {
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
      .from('invoice_installments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('[listInstallmentsForInvoice] Error:', error)
      throw new Error(`Failed to fetch installments: ${error.message}`)
    }

    return data as InvoiceInstallment[]
  } catch (error) {
    console.error('[listInstallmentsForInvoice] Exception:', error)
    throw error
  }
}

/**
 * Create multiple installments for an invoice (payment plan)
 */
export async function createInstallmentsForInvoice(
  userId: string,
  invoiceId: string,
  installments: InvoiceInstallmentInput[]
): Promise<InvoiceInstallment[]> {
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

    // Verify invoice exists and belongs to user's firm
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, amount, currency, status')
      .eq('id', invoiceId)
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found or access denied')
    }

    // Calculate total installment amount
    const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0)

    // Warn if total doesn't match invoice amount
    if (Math.abs(totalInstallmentAmount - parseFloat(invoice.amount as any)) > 0.01) {
      console.warn(
        `[createInstallmentsForInvoice] Total installment amount (${totalInstallmentAmount}) ` +
        `does not match invoice amount (${invoice.amount})`
      )
    }

    // Get invoice currency
    const invoiceCurrency = invoice.currency || 'TRY'

    // Prepare installment records
    const installmentRecords = installments.map((inst) => ({
      invoice_id: invoiceId,
      user_id: userId,
      firm_id: profile.firm_id,
      due_date: inst.dueDate,
      amount: inst.amount,
      currency: inst.currency || invoiceCurrency,
      note: inst.note || null,
      status: 'pending' as InstallmentStatus,
    }))

    // Insert installments
    const { data: newInstallments, error: insertError } = await supabase
      .from('invoice_installments')
      .insert(installmentRecords)
      .select()

    if (insertError) {
      console.error('[createInstallmentsForInvoice] Error:', insertError)
      throw new Error(`Failed to create installments: ${insertError.message}`)
    }

    console.log('[createInstallmentsForInvoice] Success:', newInstallments.length, 'installments created')
    return newInstallments as InvoiceInstallment[]
  } catch (error) {
    console.error('[createInstallmentsForInvoice] Exception:', error)
    throw error
  }
}

/**
 * Mark an installment as paid
 */
export async function markInstallmentPaid(
  userId: string,
  installmentId: string,
  data: { paidAt: string; note?: string }
): Promise<InvoiceInstallment> {
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

    // Verify installment exists and belongs to user
    const { data: existingInstallment, error: fetchError } = await supabase
      .from('invoice_installments')
      .select('*')
      .eq('id', installmentId)
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .single()

    if (fetchError || !existingInstallment) {
      throw new Error('Installment not found or access denied')
    }

    // Update installment status
    const { data: updatedInstallment, error: updateError } = await supabase
      .from('invoice_installments')
      .update({
        status: 'paid' as InstallmentStatus,
        paid_at: data.paidAt,
        note: data.note || existingInstallment.note,
      })
      .eq('id', installmentId)
      .select()
      .single()

    if (updateError) {
      console.error('[markInstallmentPaid] Error:', updateError)
      throw new Error(`Failed to mark installment as paid: ${updateError.message}`)
    }

    console.log('[markInstallmentPaid] Success:', installmentId)
    // Note: Invoice status will be automatically updated by database trigger
    return updatedInstallment as InvoiceInstallment
  } catch (error) {
    console.error('[markInstallmentPaid] Exception:', error)
    throw error
  }
}

/**
 * Update overdue installments (for cron/scheduled jobs)
 */
export async function updateOverdueInstallments(
  referenceDate: Date = new Date()
): Promise<number> {
  try {
    const supabase = await createClient()

    // Call database function
    const { data, error } = await supabase
      .rpc('update_overdue_installments', {
        p_reference_date: referenceDate.toISOString(),
      })

    if (error) {
      console.error('[updateOverdueInstallments] Error:', error)
      throw new Error(`Failed to update overdue installments: ${error.message}`)
    }

    console.log('[updateOverdueInstallments] Success:', data, 'installments updated')
    return data as number
  } catch (error) {
    console.error('[updateOverdueInstallments] Exception:', error)
    throw error
  }
}

/**
 * Get installment summary for an invoice
 */
export async function getInstallmentSummary(
  userId: string,
  invoiceId: string
): Promise<InstallmentSummary | null> {
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

    // Verify access to invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoiceId)
      .or(`user_id.eq.${userId},firm_id.eq.${profile.firm_id}`)
      .single()

    if (invoiceError || !invoice) {
      return null
    }

    // Call database function
    const { data, error } = await supabase
      .rpc('get_installment_summary', {
        p_invoice_id: invoiceId,
      })

    if (error) {
      console.error('[getInstallmentSummary] Error:', error)
      throw new Error(`Failed to get installment summary: ${error.message}`)
    }

    return data as InstallmentSummary
  } catch (error) {
    console.error('[getInstallmentSummary] Exception:', error)
    throw error
  }
}

