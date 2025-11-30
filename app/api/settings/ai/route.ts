/**
 * AI Settings API Route
 * 
 * Manages BYO (Bring Your Own) API key settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import {
  getFirmAISettings,
  upsertFirmAISettings,
  deleteFirmAISettings,
} from '../../../../lib/services/aiSettings'
import { getFirmForUser } from '../../../../lib/services/billing'
import { UpdateAISettingsRequest } from '../../../../lib/types/billing'

/**
 * GET - Fetch current AI settings (without decrypted key)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get firm
    const firm = await getFirmForUser(user.id)
    if (!firm) {
      return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
    }

    // Get settings (encrypted)
    const settings = await getFirmAISettings(firm.id)

    if (!settings) {
      return NextResponse.json({ provider: null, model: null }, { status: 200 })
    }

    // Return settings without decrypted key
    return NextResponse.json(
      {
        provider: settings.provider,
        model: settings.model,
        created_at: settings.created_at,
        updated_at: settings.updated_at,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API/settings/ai] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch AI settings',
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update AI settings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get firm
    const firm = await getFirmForUser(user.id)
    if (!firm) {
      return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
    }

    // Parse request body
    const body: UpdateAISettingsRequest = await request.json()
    const { provider, model, api_key } = body

    // Validate
    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 })
    }

    if (!model || !model.trim()) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 })
    }

    if (!api_key || !api_key.trim()) {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 })
    }

    // Upsert settings
    await upsertFirmAISettings(firm.id, {
      provider,
      model: model.trim(),
      api_key: api_key.trim(),
    })

    console.log(`[API/settings/ai] Settings saved for firm ${firm.id} (provider: ${provider}, model: ${model})`)

    return NextResponse.json(
      {
        message: 'AI settings saved successfully',
        provider,
        model,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API/settings/ai] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to save AI settings',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove AI settings
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get firm
    const firm = await getFirmForUser(user.id)
    if (!firm) {
      return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
    }

    // Delete settings
    await deleteFirmAISettings(firm.id)

    console.log(`[API/settings/ai] Settings deleted for firm ${firm.id}`)

    return NextResponse.json(
      {
        message: 'AI settings deleted successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API/settings/ai] DELETE Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete AI settings',
      },
      { status: 500 }
    )
  }
}

