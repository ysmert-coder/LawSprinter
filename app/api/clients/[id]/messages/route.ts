import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../src/lib/supabaseServer'
import {
  getClientMessages,
  addClientMessage,
  upsertClientProfile,
} from '../../../../../src/lib/services/clients'
import { analyzeClientProfileWithAI } from '../../../../../src/lib/services/ai'

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

    // Get messages
    const messages = await getClientMessages(user.id, clientId)

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('[API/clients/[id]/messages] GET Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch messages',
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

    const clientId = params.id

    // Parse request body
    const body = await request.json()
    const { direction, channel, message_text } = body

    // Validation
    if (!direction || !channel || !message_text) {
      return NextResponse.json(
        { error: 'direction, channel, and message_text are required' },
        { status: 400 }
      )
    }

    if (!['inbound', 'outbound'].includes(direction)) {
      return NextResponse.json(
        { error: 'direction must be inbound or outbound' },
        { status: 400 }
      )
    }

    if (!['whatsapp', 'telegram', 'email', 'portal', 'sms', 'note'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel' },
        { status: 400 }
      )
    }

    // Add message
    const newMessage = await addClientMessage(user.id, clientId, {
      direction,
      channel,
      message_text,
    })

    // Trigger AI profile analysis if inbound portal message
    if (direction === 'inbound' && channel === 'portal') {
      try {
        // Get all messages for context
        const allMessages = await getClientMessages(user.id, clientId, 50)

        // Get existing profile
        const { data: existingProfile } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('client_id', clientId)
          .single()

        // Call AI analysis
        const aiProfile = await analyzeClientProfileWithAI({
          userId: user.id,
          clientId,
          lastMessage: message_text,
          allMessages: allMessages.map((msg) => ({
            direction: msg.direction,
            message: msg.message_text,
            timestamp: msg.created_at,
          })),
          currentProfile: existingProfile || undefined,
        })

        // Save profile
        await upsertClientProfile(user.id, clientId, {
          sentiment_score: aiProfile.sentimentScore,
          risk_level: aiProfile.riskLevel,
          communication_style: aiProfile.communicationStyle,
          emotional_state: aiProfile.emotionalState,
          json_profile: {
            profileSummary: aiProfile.profileSummary,
            recommendations: aiProfile.recommendations,
          },
        })

        console.log('[API/clients/[id]/messages] AI profile analysis completed')
      } catch (aiError) {
        // Don't fail the request if AI analysis fails
        console.error('[API/clients/[id]/messages] AI analysis error:', aiError)
      }
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error: any) {
    console.error('[API/clients/[id]/messages] POST Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to add message',
      },
      { status: 500 }
    )
  }
}

