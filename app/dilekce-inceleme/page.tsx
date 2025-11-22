'use client'

import { useState } from 'react'
import type { PleadingReviewResponse } from '../api/pleading-review/route'

const CASE_TYPES = [
  { value: 'ceza', label: 'Ceza Hukuku' },
  { value: 'icra', label: 'İcra & İflas' },
  { value: 'aile', label: 'Aile / Boşanma' },
  { value: 'is', label: 'İş Hukuku' },
  { value: 'ticaret', label: 'Ticaret Hukuku' },
  { value: 'gayrimenkul', label: 'Gayrimenkul' },
  { value: 'idare', label: 'İdare Hukuku' },
]

export default function PleadingReviewPage() {
  const [caseType, setCaseType] = useState('')
  const [existingText, setExistingText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PleadingReviewResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!caseType) {
      setError('Lütfen dava türünü seçin')
      return
    }

    if (!existingText.trim()) {
      setError('Lütfen dilekçe metnini girin')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/pleading-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseType,
          existingText: existingText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Dilekçe incelenemedi')
      }

      setResult(data)
    } catch (err: any) {
      console.error('[pleading-review] Error:', err)
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
          <h1 className="text-3xl font-bold text-gray-900">Dilekçe İnceleme & Geliştirme</h1>
          <p className="mt-2 text-sm text-gray-600">
            Mevcut dilekçenizi AI ile inceleyin, eksikleri tespit edin ve iyileştirme önerileri alın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Mevcut Dilekçe</h2>

              {/* Case Type */}
              <div>
                <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-2">
                  Dava Türü *
                </label>
                <select
                  id="caseType"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
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

              {/* Existing Text */}
              <div>
                <label htmlFor="existingText" className="block text-sm font-medium text-gray-700 mb-2">
                  Dilekçe Metni *
                </label>
                <textarea
                  id="existingText"
                  rows={20}
                  value={existingText}
                  onChange={(e) => setExistingText(e.target.value)}
                  placeholder="Mevcut dilekçe metnini buraya yapıştırın..."
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm font-mono"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Word veya başka bir editörden dilekçenizi kopyalayıp buraya yapıştırabilirsiniz.
                </p>
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
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İnceleniyor...
                  </>
                ) : (
                  'Dilekçeyi İncele'
                )}
              </button>
            </form>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-500 text-sm">
                  Henüz inceleme yapılmadı. Soldan dava türünü seçip mevcut metni girin.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">İnceleme Sonuçları</h2>

                {/* Confidence Score */}
                {result.confidenceScore !== undefined && (
                  <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI Güven Skoru: %{Math.round(result.confidenceScore * 100)}
                  </div>
                )}

                {/* Improved Text */}
                {result.improvedText && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      İyileştirilmiş Dilekçe
                    </h3>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={result.improvedText}
                        rows={15}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-green-50 text-gray-800 text-sm font-mono resize-none"
                      />
                      <button
                        onClick={() => copyToClipboard(result.improvedText!)}
                        className="absolute top-3 right-3 p-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 text-xs"
                        title="Panoya Kopyala"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Missing Arguments */}
                {result.missingArguments && result.missingArguments.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-red-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Eksik Argümanlar ({result.missingArguments.length})
                    </h3>
                    <ul className="space-y-2">
                      {result.missingArguments.map((arg, index) => (
                        <li key={index} className="flex items-start text-sm text-red-800">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {arg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Structure Suggestions */}
                {result.structureSuggestions && result.structureSuggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Yapısal Öneriler ({result.structureSuggestions.length})
                    </h3>
                    <ul className="space-y-2">
                      {result.structureSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start text-sm text-blue-800">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Points */}
                {result.riskPoints && result.riskPoints.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-yellow-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Risk Noktaları ({result.riskPoints.length})
                    </h3>
                    <ul className="space-y-2">
                      {result.riskPoints.map((risk, index) => (
                        <li key={index} className="flex items-start text-sm text-yellow-800">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">
                      İlgili Kaynaklar ({result.sources.length})
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
                                  className="text-xs text-purple-600 hover:text-purple-700 mt-1 inline-flex items-center"
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
                                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
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

