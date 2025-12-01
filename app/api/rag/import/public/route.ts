/**
 * RAG Import API - Public Documents
 * 
 * Admin-only endpoint to import public legal documents
 * Uploads to Supabase Storage, extracts text, generates embeddings via n8n
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabaseServer'
import { isAdmin } from '@/lib/middleware/adminCheck'
import {
  createPublicLegalDoc,
  insertPublicChunksFromEmbeddings,
  LegalArea,
  DocumentType,
} from '@/lib/services/rag'
import { callN8NEmbeddings } from '@/lib/n8n'
import { parseFile, isValidFileType } from '@/lib/utils/fileParser'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Admin check
    const userIsAdmin = await isAdmin(user.email!)
    if (!userIsAdmin) {
      console.warn(`[RAG Import] Unauthorized access attempt by: ${user.email}`)
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const area = formData.get('area') as LegalArea
    const docType = formData.get('docType') as DocumentType
    const court = (formData.get('court') as string) || null
    const yearStr = formData.get('year') as string
    const year = yearStr ? parseInt(yearStr, 10) : null

    // 4. Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
    }

    if (!title || !area || !docType) {
      return NextResponse.json({ error: 'Başlık, alan ve doküman tipi gerekli' }, { status: 400 })
    }

    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya formatı. PDF, DOCX veya TXT kullanın' },
        { status: 400 }
      )
    }

    // 5. Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExt}`
    const storagePath = `public_docs/${uniqueFilename}`

    const { error: uploadError } = await supabase.storage
      .from('rag_public')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[RAG Import] Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Dosya yüklenemedi', 
        details: uploadError.message,
        hint: 'Supabase Storage bucket (rag_public) var mı? Policies doğru mu?'
      }, { status: 500 })
    }

    // 7. Extract text
    let text: string
    try {
      text = await parseFile(buffer, file.name)
    } catch (parseError: any) {
      console.error('[RAG Import] Parse error:', parseError)
      // Cleanup storage on parse failure
      await supabase.storage.from('rag_public').remove([storagePath])
      return NextResponse.json(
        { error: `Dosya işlenemedi: ${parseError.message}` },
        { status: 400 }
      )
    }

    if (!text || text.trim().length < 50) {
      await supabase.storage.from('rag_public').remove([storagePath])
      return NextResponse.json(
        { error: 'Dosya içeriği çıkarılamadı veya çok kısa' },
        { status: 400 }
      )
    }

    // 8. Create document record
    const docId = await createPublicLegalDoc({
      title,
      area,
      docType,
      court,
      year,
      storagePath,
      textLength: text.length,
    })

    console.log(`[RAG Import] Created doc: ${docId}, length: ${text.length} chars`)

    // 9. Generate embeddings via n8n
    let embeddingResponse
    try {
      embeddingResponse = await callN8NEmbeddings({
        docId,
        text,
        isPublic: true,
      })
    } catch (embedError: any) {
      console.error('[RAG Import] Embedding generation error:', embedError)
      return NextResponse.json(
        {
          error: 'Embedding oluşturulamadı',
          details: embedError.message,
          docId, // Return docId so admin can retry manually if needed
        },
        { status: 500 }
      )
    }

    // 10. Insert chunks
    const chunksInserted = await insertPublicChunksFromEmbeddings({
      docId,
      chunks: embeddingResponse.chunks,
    })

    console.log(`[RAG Import] Inserted ${chunksInserted} chunks for doc ${docId}`)

    // 11. Success response
    return NextResponse.json(
      {
        success: true,
        docId,
        title,
        chunksInserted,
        textLength: text.length,
        model: embeddingResponse.model,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[RAG Import] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Bir hata oluştu',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

