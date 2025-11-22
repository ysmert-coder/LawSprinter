import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../src/lib/supabaseServer'
import {
  listInstallmentsForInvoice,
  createInstallmentsForInvoice,
} from '../../../../../../lib/services/accounting'
import type { InvoiceInstallmentInput } from '../../../../../../types/database'

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

    // Get installments
    const installments = await listInstallmentsForInvoice(user.id, invoiceId)

    return NextResponse.json(installments)
  } catch (error: any) {
    console.error('[installments] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch installments',
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
    const { installments } = body

    // Validation
    if (!installments || !Array.isArray(installments) || installments.length === 0) {
      return NextResponse.json(
        { error: 'Installments array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each installment
    for (const inst of installments) {
      if (!inst.dueDate || !inst.amount) {
        return NextResponse.json(
          { error: 'Each installment must have dueDate and amount' },
          { status: 400 }
        )
      }

      if (inst.amount <= 0) {
        return NextResponse.json(
          { error: 'Installment amount must be greater than 0' },
          { status: 400 }
        )
      }
    }

    // Create installments
    const newInstallments = await createInstallmentsForInvoice(
      user.id,
      invoiceId,
      installments as InvoiceInstallmentInput[]
    )

    return NextResponse.json(newInstallments, { status: 201 })
  } catch (error: any) {
    console.error('[installments] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create installments',
      },
      { status: 500 }
    )
  }
}

