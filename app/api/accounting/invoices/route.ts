import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { getInvoicesWithDetails, createInvoice } from '../../../../lib/services/accounting'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoices with details
    const invoices = await getInvoicesWithDetails(user.id)

    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error('[accounting/invoices] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch invoices',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      case_id,
      client_id,
      invoice_number,
      description,
      amount,
      currency,
      status,
      due_date,
      notes,
    } = body

    // Validation
    if (!description || !amount) {
      return NextResponse.json(
        { error: 'Description and amount are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Create invoice
    const invoice = await createInvoice(user.id, {
      case_id,
      client_id,
      invoice_number,
      description,
      amount: parseFloat(amount),
      currency: currency || 'TRY',
      status: status || 'draft',
      due_date,
      notes,
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('[accounting/invoices] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create invoice',
      },
      { status: 500 }
    )
  }
}

