import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'
import {
  listClientsForUser,
  createClient as createClientService,
  getClientsWithStats,
} from '../../../src/lib/services/clients'

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

    // Check if stats are requested
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'

    if (includeStats) {
      const clients = await getClientsWithStats(user.id)
      return NextResponse.json(clients)
    }

    const clients = await listClientsForUser(user.id)
    return NextResponse.json(clients)
  } catch (error: any) {
    console.error('[API/clients] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch clients',
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
    const { full_name, email, phone, whatsapp_number, type, address, tax_number, notes } = body

    // Validation
    if (!full_name || full_name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    // Create client
    const newClient = await createClientService(user.id, {
      full_name: full_name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      whatsapp_number: whatsapp_number?.trim() || undefined,
      type: type || 'individual',
      address: address?.trim() || undefined,
      tax_number: tax_number?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error: any) {
    console.error('[API/clients] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create client',
      },
      { status: 500 }
    )
  }
}
