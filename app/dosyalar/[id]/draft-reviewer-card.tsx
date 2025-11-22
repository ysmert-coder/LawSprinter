'use client'

import { useState } from 'react'
import { DraftReviewResponse } from '../../../lib/types/ai'

interface DraftReviewerCardProps {
  caseId: string
  userId: string
}

export default function DraftReviewerCard({ caseId, userId }: DraftReviewerCardProps) {
  const [draftText, setDraftText] = useState('')
  const [caseType, setCaseType] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DraftReviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const caseTypes = [
    { value: '', label: 'Seçiniz (Opsiyonel)' },
    { value: 'labor', label: 'İş Hukuku' },
    { value: 'criminal', label: 'Ceza' },
    { value: 'civil', label: 'Hukuk' },
    { value: 'family', label: 'Aile' },
    { value: 'commercial', label: 'Ticaret' },
    { value: 'administrative', label: 'İdari' },
    { value: 'execution', label: 'İcra & İflas' },
    { value: 'real_estate', label: 'Gayrimenkul' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!draftText.trim()) {
      setError('Lütfen taslağınızı girin')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/drafts/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          caseType: caseType || undefined,
          draftText: draftText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Taslak incelenemedi')
      }

      setResult(data)
    } catch (err: any) {
      console.error('[draft-reviewer] Error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Taslak İncele (AI)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Dilekçe taslağınızı AI ile inceleyin, eksikleri ve iyileştirme önerilerini görün
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start">
        <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="ml-2 text-xs text-purple-700">
          <strong>Not:</strong> Bu değerlendirme taslak niteliğindedir, nihai hukuki görüş değildir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Type Selection (Optional) */}
        <div>
          <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-2">
            Dava Türü (Opsiyonel)
          </label>
          <select
            id="caseType"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
          >
            {caseTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Dava türü belirtirseniz, AI daha spesifik önerilerde bulunabilir.
          </p>
        </div>

        {/* Draft Text */}
        <div>
          <label htmlFor="draftText" className="block text-sm font-medium text-gray-700 mb-2">
            Dilekçe Taslağı *
          </label>
          <textarea
            id="draftText"
            rows={12}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Hazırladığınız dilekçe taslağını buraya yapıştırın..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm font-mono"
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            Taslağınızı olduğu gibi yapıştırın. AI eksikleri, çelişkileri ve iyileştirme önerilerini tespit edecek.
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
          disabled={loading || !draftText.trim()}
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
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Taslağı İncele
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İnceleme Sonuçları</h3>
            
            {/* Overall Comment */}
            {result.overallComment && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Genel Değerlendirme
                </h4>
                <p className="text-sm text-blue-800">{result.overallComment}</p>
              </div>
            )}

            {/* Issues */}
            {result.issues && result.issues.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Tespit Edilen Sorunlar ({result.issues.length})
                </h4>
                <ul className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <li key={index} className="flex items-start text-sm text-red-800">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Geliştirme Önerileri ({result.suggestions.length})
                </h4>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start text-sm text-green-800">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Citations */}
            {result.suggestedCitations && result.suggestedCitations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Önerilen Dayanaklar ({result.suggestedCitations.length})
                </h4>
                <div className="space-y-3">
                  {result.suggestedCitations.map((citation, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-900">
                            {citation.title || 'Başlık Yok'}
                          </h5>
                          {citation.court && (
                            <p className="text-xs text-gray-600 mt-1">{citation.court}</p>
                          )}
                          {citation.url && (
                            <a
                              href={citation.url}
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
                        {citation.similarity !== undefined && (
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              %{Math.round(citation.similarity * 100)} ilgili
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

