'use client'

import { useState } from 'react'

interface CaseAssistantFormProps {
  userId: string
}

export default function CaseAssistantForm({ userId }: CaseAssistantFormProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const caseTypes = [
    { value: 'labor', label: 'İş Hukuku', icon: '💼' },
    { value: 'criminal', label: 'Ceza', icon: '⚖️' },
    { value: 'civil', label: 'Hukuk', icon: '📋' },
    { value: 'family', label: 'Aile', icon: '👨‍👩‍👧‍👦' },
    { value: 'commercial', label: 'Ticaret', icon: '🏢' },
    { value: 'administrative', label: 'İdari', icon: '🏛️' },
    { value: 'execution', label: 'İcra', icon: '📜' },
    { value: 'other', label: 'Diğer', icon: '📁' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Lütfen bir dava türü seçin')
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      // For now, we'll send the request without file upload
      // In production, you'd upload to Supabase Storage first
      const response = await fetch('/api/case-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseType: selectedType,
          shortDescription: description,
          fileUrl: file ? `placeholder-${file.name}` : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analiz başarısız oldu')
      }

      setAnalysis(data.analysis)
    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Yükleme</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-sm text-gray-600">
              {file ? file.name : 'PDF, DOCX veya TXT dosyalarını sürükleyip bırakın'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              veya
            </p>
            <label className="mt-3 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              Dosya Seç
            </label>
          </div>
        </div>

        {/* Case Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dava Türü *</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {caseTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                  selectedType === type.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl mb-2">{type.icon}</span>
                <span className="text-sm font-medium text-gray-700">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kısa Açıklama</h2>
          
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dava hakkında kısa bir açıklama yazın (opsiyonel)"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="ml-2 text-xs text-gray-600">
              <strong>Önemli:</strong> AI tarafından üretilen içerik taslak niteliğindedir. 
              Mutlaka avukat kontrolünden geçmelidir.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedType}
            className="ml-4 inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analiz Et
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {analysis && (
        <div className="space-y-6">
          {/* Event Summary */}
          {analysis.eventSummary && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Olay Özeti
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{analysis.eventSummary}</p>
            </div>
          )}

          {/* Defence Outline */}
          {analysis.defenceOutline && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Savunma İskeleti
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{analysis.defenceOutline}</p>
            </div>
          )}

          {/* Action Items */}
          {analysis.actionItems && analysis.actionItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Yapılacaklar Listesi
              </h3>
              <ul className="space-y-2">
                {analysis.actionItems.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

