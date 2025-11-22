/**
 * RAG Public Document Import API
 * 
 * Imports public legal documents (case law, statutes, doctrine)
 * with automatic embedding generation via n8n
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabaseServer'
import { importPublicDoc, ImportPublicDocParams } from '../../../../lib/services/rag'

/**
 * Request body type
 */
type ImportRequest = {
  title: string
  docType: string
  court?: string
  date?: string
  url?: string
  rawText: string
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
    const body: ImportRequest = await request.json()
    const { title, docType, court, date, url, rawText } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (!docType || !docType.trim()) {
      return NextResponse.json({ error: 'docType is required' }, { status: 400 })
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 })
    }

    console.log('[import-public] Importing document:', {
      title: title.substring(0, 50) + '...',
      docType,
      court,
      userId: user.id,
      textLength: rawText.length,
    })

    // Import document
    const params: ImportPublicDocParams = {
      title: title.trim(),
      docType: docType.trim(),
      court: court?.trim() || null,
      date: date?.trim() || null,
      url: url?.trim() || null,
      rawText: rawText.trim(),
    }

    const result = await importPublicDoc(params)

    console.log('[import-public] Document imported successfully:', result.docId)

    return NextResponse.json(
      {
        docId: result.docId,
        message: 'Document imported successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[import-public] Error:', error)

    // Determine status code based on error
    const statusCode = error.message?.includes('required') ? 400 : 500

    return NextResponse.json(
      {
        error: error.message || 'Failed to import document',
      },
      { status: statusCode }
    )
  }
}

