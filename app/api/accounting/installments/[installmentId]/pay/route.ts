import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../src/lib/supabaseServer'
import { markInstallmentPaid } from '../../../../../lib/services/accounting'

export async function POST(
  request: NextRequest,
  { params }: { params: { installmentId: string } }
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

    const installmentId = params.installmentId

    // Parse request body
    const body = await request.json()
    const { paidAt, note } = body

    // Use provided paidAt or default to now
    const paymentDate = paidAt || new Date().toISOString()

    // Mark installment as paid
    const updatedInstallment = await markInstallmentPaid(user.id, installmentId, {
      paidAt: paymentDate,
      note,
    })

    // Get updated invoice info
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, paid_at')
      .eq('id', updatedInstallment.invoice_id)
      .single()

    return NextResponse.json({
      installment: updatedInstallment,
      invoice: invoice || null,
    })
  } catch (error: any) {
    console.error('[installments/pay] POST Error:', error)

    // Check for specific error types
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to mark installment as paid',
      },
      { status: 500 }
    )
  }
}

