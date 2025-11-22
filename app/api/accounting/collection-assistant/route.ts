import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import {
  generateCollectionMessage,
  type CollectionAssistantChannel,
} from '../../../../src/lib/services/ai'

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
    const { clientId, invoiceIds, preferredChannel, tone } = body

    // Validation
    if (!clientId || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'clientId and invoiceIds (array) are required' },
        { status: 400 }
      )
    }

    if (!preferredChannel || !['email', 'whatsapp', 'sms'].includes(preferredChannel)) {
      return NextResponse.json(
        { error: 'preferredChannel must be one of: email, whatsapp, sms' },
        { status: 400 }
      )
    }

    if (tone && !['soft', 'neutral', 'firm'].includes(tone)) {
      return NextResponse.json(
        { error: 'tone must be one of: soft, neutral, firm' },
        { status: 400 }
      )
    }

    // Security: Verify all invoices belong to the user
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .in('id', invoiceIds)
      .eq('user_id', user.id)

    if (invoiceError) {
      console.error('[collection-assistant] Invoice fetch error:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to verify invoices' },
        { status: 500 }
      )
    }

    // Check if all requested invoices belong to the user
    if (!invoices || invoices.length !== invoiceIds.length) {
      console.warn(
        '[collection-assistant] Access denied: User',
        user.id,
        'requested',
        invoiceIds.length,
        'invoices but only',
        invoices?.length || 0,
        'belong to them'
      )
      return NextResponse.json(
        { error: 'Access denied: One or more invoices do not belong to you' },
        { status: 403 }
      )
    }

    // Generate collection message via n8n
    const response = await generateCollectionMessage({
      userId: user.id,
      clientId,
      invoiceIds,
      preferredChannel: preferredChannel as CollectionAssistantChannel,
      tone,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[collection-assistant] Error:', error)

    // Check for specific error types
    if (error.message.includes('not configured')) {
      return NextResponse.json(
        {
          error:
            'Tahsilat asistanı şu an yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin.',
        },
        { status: 503 }
      )
    }

    if (error.message.includes('timed out')) {
      return NextResponse.json(
        {
          error:
            'Tahsilat asistanı yanıt vermedi. Lütfen daha sonra tekrar deneyin.',
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Tahsilat mesajı oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    )
  }
}

