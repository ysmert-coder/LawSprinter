import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabaseServer'
import { triggerContractAnalyze } from '@/src/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json()

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single<{ firm_id: string }>()

    if (!profile?.firm_id) {
      return NextResponse.json(
        { error: 'User not associated with a firm' },
        { status: 403 }
      )
    }

    // Verify contract belongs to user's firm
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, firm_id')
      .eq('id', contractId)
      .eq('firm_id', profile.firm_id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found or access denied' },
        { status: 404 }
      )
    }

    // Trigger n8n webhook for contract analysis
    try {
      await triggerContractAnalyze(contractId)
    } catch (n8nError: any) {
      console.error('n8n webhook error:', n8nError)
      // Don't fail the request if n8n is not configured
      if (n8nError.message.includes('not defined')) {
        return NextResponse.json({
          success: true,
          message: 'Sözleşme analizi başlatıldı (n8n yapılandırması bekleniyor)',
          warning: 'n8n entegrasyonu henüz yapılandırılmamış'
        })
      }
      throw n8nError
    }

    return NextResponse.json({
      success: true,
      message: 'Sözleşme analizi başarıyla başlatıldı'
    })
  } catch (error: any) {
    console.error('Contract analyze error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

