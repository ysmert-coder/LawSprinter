import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../src/lib/supabaseServer'
import { getInvoiceWithDetails } from '../../../../../lib/services/accounting'

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

    // Get invoice with details
    const invoice = await getInvoiceWithDetails(user.id, invoiceId)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('[accounting/invoices/[id]] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch invoice',
      },
      { status: 500 }
    )
  }
}

