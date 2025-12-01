/**
 * Storage Test Page - Admin Only
 * Tests Supabase Storage bucket and policies
 */

import { createClient } from '@/src/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function StorageTestPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Admin check
  const isAdmin = user.email === (process.env.ADMIN_EMAIL || 'salihmrtpayoneer@gmail.com')
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Test 1: List buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  // Test 2: Check rag_public bucket
  const ragPublicBucket = buckets?.find((b) => b.name === 'rag_public')

  // Test 3: Try to list files in rag_public
  let filesInBucket: any[] = []
  let filesError: any = null
  if (ragPublicBucket) {
    const { data: files, error } = await supabase.storage.from('rag_public').list('public_docs')
    filesInBucket = files || []
    filesError = error
  }

  // Test 4: Check tables
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('public_legal_docs', 'public_legal_chunks', 'firm_billing')
    `,
  }).catch(() => ({ data: null, error: 'RPC not available, checking directly...' }))

  // Alternative: Direct table check
  const { error: docsTableError } = await supabase.from('public_legal_docs').select('id').limit(1)
  const { error: chunksTableError } = await supabase.from('public_legal_chunks').select('id').limit(1)
  const { error: billingTableError } = await supabase.from('firm_billing').select('firm_id').limit(1)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Storage & Database Test</h1>
          <p className="text-sm text-gray-600 mb-8">Admin: {user.email}</p>

          {/* Test 1: Buckets */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">📦 Test 1: Storage Buckets</h2>
            {bucketsError ? (
              <div className="bg-red-50 p-3 rounded text-red-800">
                ❌ Error: {bucketsError.message}
              </div>
            ) : (
              <div>
                <p className="text-green-600 font-medium mb-2">✅ Buckets found: {buckets?.length || 0}</p>
                <ul className="list-disc list-inside space-y-1">
                  {buckets?.map((bucket) => (
                    <li key={bucket.id} className="text-sm">
                      <span className="font-mono">{bucket.name}</span>
                      {bucket.public && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Public</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Test 2: rag_public bucket */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🎯 Test 2: rag_public Bucket</h2>
            {ragPublicBucket ? (
              <div className="bg-green-50 p-3 rounded text-green-800">
                ✅ Bucket exists!
                <div className="mt-2 text-sm">
                  <p>ID: {ragPublicBucket.id}</p>
                  <p>Public: {ragPublicBucket.public ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-3 rounded text-red-800">
                ❌ Bucket NOT FOUND!
                <p className="mt-2 text-sm">
                  Create it: Supabase Dashboard → Storage → New Bucket → Name: rag_public, Public: Yes
                </p>
              </div>
            )}
          </div>

          {/* Test 3: Files in bucket */}
          {ragPublicBucket && (
            <div className="mb-8 p-4 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">📁 Test 3: Files in rag_public</h2>
              {filesError ? (
                <div className="bg-yellow-50 p-3 rounded text-yellow-800">
                  ⚠️ Cannot list files: {filesError.message}
                  <p className="mt-2 text-sm">This might be a policy issue. Check storage policies.</p>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded text-green-800">
                  ✅ Files: {filesInBucket.length}
                  {filesInBucket.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {filesInBucket.slice(0, 5).map((file: any) => (
                        <li key={file.name}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test 4: Tables */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🗄️ Test 4: Database Tables</h2>
            <div className="space-y-2">
              <div className={`p-2 rounded ${docsTableError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                {docsTableError ? '❌' : '✅'} public_legal_docs
                {docsTableError && <span className="text-xs ml-2">({docsTableError.message})</span>}
              </div>
              <div className={`p-2 rounded ${chunksTableError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                {chunksTableError ? '❌' : '✅'} public_legal_chunks
                {chunksTableError && <span className="text-xs ml-2">({chunksTableError.message})</span>}
              </div>
              <div className={`p-2 rounded ${billingTableError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                {billingTableError ? '❌' : '✅'} firm_billing
                {billingTableError && <span className="text-xs ml-2">({billingTableError.message})</span>}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">📋 Summary</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Storage:</strong>{' '}
                {ragPublicBucket ? (
                  <span className="text-green-600">✅ Ready</span>
                ) : (
                  <span className="text-red-600">❌ Bucket missing</span>
                )}
              </p>
              <p>
                <strong>Tables:</strong>{' '}
                {!docsTableError && !chunksTableError && !billingTableError ? (
                  <span className="text-green-600">✅ Ready</span>
                ) : (
                  <span className="text-red-600">❌ Some tables missing</span>
                )}
              </p>
              <p className="mt-4 text-gray-600">
                If anything is ❌, check DEBUG_RAG_UPLOAD.md for solutions.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex space-x-4">
            <a
              href="/admin/rag-import"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go to RAG Import
            </a>
            <a
              href="/dashboard"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

