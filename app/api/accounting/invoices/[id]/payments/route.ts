import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../src/lib/supabaseServer'
import { listPaymentsForInvoice, addPaymentToInvoice } from '../../../../../../lib/services/accounting'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoiceId = params.id

    // Get payments for invoice
    const payments = await listPaymentsForInvoice(user.id, invoiceId)

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('[accounting/invoices/[id]/payments] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch payments',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoiceId = params.id

    // Parse request body
    const body = await request.json()
    const { amount, paid_at, payment_method, notes } = body

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Add payment
    const payment = await addPaymentToInvoice(user.id, invoiceId, {
      amount: parseFloat(amount),
      paid_at: paid_at || new Date().toISOString(),
      payment_method: payment_method || 'other',
      notes,
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('[accounting/invoices/[id]/payments] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to add payment',
      },
      { status: 500 }
    )
  }
}

