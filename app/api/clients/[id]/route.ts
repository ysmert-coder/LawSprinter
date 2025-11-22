import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { getClientById, getClientProfile } from '../../../../src/lib/services/clients'

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

    const clientId = params.id

    // Get client
    const client = await getClientById(user.id, clientId)

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get profile (optional)
    const profile = await getClientProfile(user.id, clientId)

    // Get open cases count
    const { data: cases } = await supabase
      .from('cases')
      .select('id, title, case_type, status, updated_at')
      .eq('client_id', clientId)
      .not('status', 'in', '(closed,won,archived)')
      .order('updated_at', { ascending: false })

    // Get financial summary
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, currency, status')
      .eq('client_id', clientId)

    const totalInvoiced = invoices?.reduce((sum, inv) => {
      if (inv.currency === 'TRY') {
        return sum + parseFloat(inv.amount as any)
      }
      return sum
    }, 0) || 0

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, invoice_id')
      .in(
        'invoice_id',
        invoices?.map((inv: any) => inv.id) || []
      )

    const totalPaid = payments?.reduce((sum, pay) => sum + parseFloat(pay.amount as any), 0) || 0

    return NextResponse.json({
      ...client,
      profile,
      open_cases: cases || [],
      open_cases_count: cases?.length || 0,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
    })
  } catch (error: any) {
    console.error('[API/clients/[id]] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch client',
      },
      { status: 500 }
    )
  }
}

