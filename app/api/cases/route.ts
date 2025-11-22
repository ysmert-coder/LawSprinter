import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../src/lib/supabaseServer'

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

    // Get user's firm_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (!profile?.firm_id) {
      return NextResponse.json([])
    }

    // Get cases
    const { data: cases, error } = await supabase
      .from('cases')
      .select('id, title, case_number, case_type, status')
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[cases] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cases' },
        { status: 500 }
      )
    }

    return NextResponse.json(cases || [])
  } catch (error: any) {
    console.error('[cases] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

