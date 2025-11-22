'use client'

import { useState } from 'react'
import { DraftType, DraftGeneratorResponse } from '../../../lib/types/ai'

interface DraftGeneratorCardProps {
  caseId: string
  caseType: string
  userId: string
}

export default function DraftGeneratorCard({ caseId, caseType, userId }: DraftGeneratorCardProps) {
  const [draftType, setDraftType] = useState<DraftType>('dava_dilekcesi')
  const [factSummary, setFactSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DraftGeneratorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const draftTypes: { value: DraftType; label: string; description: string }[] = [
    { value: 'dava_dilekcesi', label: 'Dava Dilekçesi', description: 'Yeni dava açmak için' },
    { value: 'cevap_dilekcesi', label: 'Cevap Dilekçesi', description: 'Davaya cevap vermek için' },
    { value: 'istinaf', label: 'İstinaf Dilekçesi', description: 'Yerel mahkeme kararına itiraz' },
    { value: 'temyiz', label: 'Temyiz Dilekçesi', description: 'Yargıtay\'a başvuru' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!factSummary.trim()) {
      setError('Lütfen olay özetini girin')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/cases/${caseId}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseType,
          draftType,
          factSummary: factSummary.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Dilekçe taslağı oluşturulamadı')
      }

      setResult(data)
    } catch (err: any) {
      console.error('[draft-generator] Error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.draftText) {
      navigator.clipboard.writeText(result.draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Dilekçe Taslak Üretici (AI)</h2>
          <p className="mt-1 text-sm text-gray-600">
            AI destekli dilekçe taslağı oluşturun
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="ml-2 text-xs text-yellow-700">
          <strong>Önemli:</strong> Bu taslak AI tarafından üretilmiştir, lütfen göndermeden önce kontrol edin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Draft Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dilekçe Türü *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {draftTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setDraftType(type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  draftType === type.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{type.label}</div>
                <div className="text-xs text-gray-600 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fact Summary */}
        <div>
          <label htmlFor="factSummary" className="block text-sm font-medium text-gray-700 mb-2">
            Olay Özeti *
          </label>
          <textarea
            id="factSummary"
            rows={6}
            value={factSummary}
            onChange={(e) => setFactSummary(e.target.value)}
            placeholder="Dava ile ilgili olay özetini, önemli detayları ve tarafların durumunu açıklayın..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            Ne kadar detaylı bilgi verirseniz, AI o kadar iyi bir taslak oluşturabilir.
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
          disabled={loading || !factSummary.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Taslak Oluşturuluyor...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Taslak Oluştur
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oluşturulan Taslak</h3>
            
            {/* Draft Text */}
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
                {result.draftText}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Panoya Kopyala
                  </>
                )}
              </button>
            </div>

            {/* Action Items */}
            {result.actionItems && result.actionItems.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Kontrol Etmeniz Önerilen Noktalar
                </h4>
                <ul className="space-y-2">
                  {result.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start text-sm text-blue-800">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            {result.usedSources && result.usedSources.length > 0 && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Dayanaklar / Kaynaklar
                </h4>
                <div className="space-y-3">
                  {result.usedSources.map((source, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-900">
                            {source.title || 'Başlık Yok'}
                          </h5>
                          {source.court && (
                            <p className="text-xs text-gray-600 mt-1">{source.court}</p>
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
                        {source.similarity !== undefined && (
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              %{Math.round(source.similarity * 100)} benzerlik
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {result.notes && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Not:</strong> {result.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

