'use client'

import { useState } from 'react'
import { createClient } from '../../src/lib/supabaseBrowser'
import type { PleadingGenerateResponse } from '../api/pleading-generate/route'
import type { RagSource } from '../../lib/services/rag'

const CASE_TYPES = [
  { value: 'ceza', label: 'Ceza Hukuku' },
  { value: 'icra', label: 'İcra & İflas' },
  { value: 'aile', label: 'Aile / Boşanma' },
  { value: 'is', label: 'İş Hukuku' },
  { value: 'ticaret', label: 'Ticaret Hukuku' },
  { value: 'gayrimenkul', label: 'Gayrimenkul' },
  { value: 'idare', label: 'İdare Hukuku' },
]

export default function PleadingGeneratorPage() {
  const [caseType, setCaseType] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PleadingGenerateResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setFileUrl(null) // Reset previous upload
    }
  }

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `pleadings_uploads/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error('Dosya yüklenemedi: ' + uploadError.message)
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (err: any) {
      console.error('[upload] Error:', err)
      setError(err.message || 'Dosya yüklenirken hata oluştu')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!caseType) {
      setError('Lütfen dava türünü seçin')
      return
    }

    if (!shortDescription.trim()) {
      setError('Lütfen olay özetini girin')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Upload file if present
      let uploadedFileUrl = fileUrl
      if (file && !fileUrl) {
        uploadedFileUrl = await uploadFile()
        if (!uploadedFileUrl) {
          setLoading(false)
          return // Error already set by uploadFile
        }
        setFileUrl(uploadedFileUrl)
      }

      // Call API
      const response = await fetch('/api/pleading-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseType,
          shortDescription: shortDescription.trim(),
          fileUrl: uploadedFileUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Dilekçe taslağı oluşturulamadı')
      }

      setResult(data)
    } catch (err: any) {
      console.error('[pleading-generate] Error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Metin panoya kopyalandı!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dilekçe Üretici</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI destekli dilekçe taslağı oluşturun. Emsal kararlar ve mevzuat ile desteklenir.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Case Type */}
              <div>
                <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-2">
                  Dava Türü *
                </label>
                <select
                  id="caseType"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  {CASE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Description */}
              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Olay Özeti *
                </label>
                <textarea
                  id="shortDescription"
                  rows={8}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Dava ile ilgili olay özetini, önemli tarihleri, tarafları ve talepleri detaylıca girin..."
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Dosya Yükleme (Opsiyonel)
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {file && (
                  <p className="mt-2 text-xs text-gray-500">
                    Seçili: {file.name}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploading ? 'Dosya yükleniyor...' : 'Dilekçe oluşturuluyor...'}
                  </>
                ) : (
                  'Dilekçe Taslağı Üret'
                )}
              </button>
            </form>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  Henüz dilekçe oluşturulmadı. Formu doldurup "Dilekçe Taslağı Üret" butonuna tıklayın.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Oluşturulan Dilekçe Taslağı</h2>

                {/* Draft Text */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={result.draftText}
                    rows={20}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 text-sm font-mono resize-none"
                  />
                  <button
                    onClick={() => copyToClipboard(result.draftText)}
                    className="absolute top-3 right-3 p-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 text-xs"
                    title="Panoya Kopyala"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>

                {/* Confidence Score */}
                {result.confidenceScore !== undefined && (
                  <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI Güven Skoru: %{Math.round(result.confidenceScore * 100)}
                  </div>
                )}

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">
                      Kullanılan Kaynaklar ({result.sources.length})
                    </h3>
                    <div className="space-y-3">
                      {result.sources.map((source, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {source.title || `Kaynak ${index + 1}`}
                              </h4>
                              {source.court && (
                                <p className="text-xs text-gray-600 mt-1">{source.court}</p>
                              )}
                              {source.snippet && (
                                <p className="text-xs text-gray-700 mt-2 italic">
                                  "{source.snippet}"
                                </p>
                              )}
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center"
                                >
                                  Kaynağı Görüntüle
                                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              {source.similarity !== undefined && (
                                <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                  %{Math.round(source.similarity * 100)} ilgili
                                </span>
                              )}
                              {source.scope && (
                                <span className={`mt-1 inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                                  source.scope === 'public' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {source.scope === 'public' ? 'Genel' : 'Özel'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

