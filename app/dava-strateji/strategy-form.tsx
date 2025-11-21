'use client'

import { useState } from 'react'
import { createClient } from '../supabase'

type AreaType = 'ceza' | 'gayrimenkul' | 'icra_iflas' | 'aile'

type StrategyResponse = {
  summary: string
  keyIssues: string[]
  recommendedStrategy: string
  risks?: string[]
  sources?: {
    id?: string
    title?: string
    court?: string
    url?: string
    similarity?: number
  }[]
  confidenceScore?: number
}

interface StrategyFormProps {
  userId: string
}

export default function StrategyForm({ userId }: StrategyFormProps) {
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null)
  const [question, setQuestion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lawAreas = [
    {
      id: 'ceza' as AreaType,
      name: 'Ceza Hukuku',
      icon: '⚖️',
      description: 'Ceza davalarında strateji geliştirin',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'gayrimenkul' as AreaType,
      name: 'Gayrimenkul',
      icon: '🏠',
      description: 'Tapu, kira ve inşaat davaları',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'icra_iflas' as AreaType,
      name: 'İcra & İflas',
      icon: '📜',
      description: 'İcra takibi ve iflas süreçleri',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'aile' as AreaType,
      name: 'Aile / Boşanma',
      icon: '👨‍👩‍👧‍👦',
      description: 'Boşanma, velayet ve nafaka davaları',
      color: 'from-pink-500 to-pink-600'
    },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `strategy_uploads/${fileName}`

    const { data, error } = await supabase.storage
      .from('strategy_uploads')
      .upload(filePath, file)

    if (error) {
      throw new Error(`Dosya yükleme hatası: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('strategy_uploads')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async () => {
    if (!selectedArea) {
      setError('Lütfen bir hukuk alanı seçin')
      return
    }

    if (!question.trim()) {
      setError('Lütfen bir soru veya açıklama girin')
      return
    }

    setLoading(true)
    setError(null)
    setStrategy(null)

    try {
      let fileUrl: string | undefined

      // Upload file if provided
      if (file) {
        setUploading(true)
        fileUrl = await uploadFileToSupabase(file)
        setUploading(false)
        console.log('[strategy] File uploaded:', fileUrl)
      }

      // Call API
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: selectedArea,
          question: question.trim(),
          fileUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Strateji oluşturulamadı')
      }

      console.log('[strategy] Strategy received:', data)
      setStrategy(data)
    } catch (err: any) {
      console.error('[strategy] Error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Law Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {lawAreas.map((area) => (
          <div
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all cursor-pointer ${
              selectedArea === area.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className={`h-2 bg-gradient-to-r ${area.color}`}></div>
            <div className="p-6">
              <div className="flex items-start">
                <span className="text-4xl mr-4">{area.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                  {selectedArea === area.id && (
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Seçildi
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Strateji Oluştur</h2>

        {/* File Upload (Optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosya Yükle (Opsiyonel)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {file ? file.name : 'Dilekçe, tutanak, bilirkişi raporu vb. yükleyin'}
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

        {/* Question Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soru / Açıklama *
          </label>
          <textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Dava ile ilgili sorunuzu veya durumu detaylı olarak açıklayın..."
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
              <strong>Taslak / Öneri:</strong> AI çıktıları kesin hüküm değildir. 
              Avukat karar vericidir.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading || !selectedArea || !question.trim()}
            className="ml-4 inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Dosya Yükleniyor...
              </>
            ) : loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Strateji Oluşturuluyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Strateji Üret
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {strategy ? (
        <div className="mt-6 space-y-6">
          {/* Confidence Score Badge */}
          {strategy.confidenceScore !== undefined && (
            <div className="flex justify-end">
              <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-green-700">
                  %{Math.round(strategy.confidenceScore * 100)} Güven Skoru
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">📋</span>
                <h3 className="text-sm font-semibold text-blue-900">Özet</h3>
              </div>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{strategy.summary}</p>
            </div>

            {/* Key Issues */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">⚠️</span>
                <h3 className="text-sm font-semibold text-yellow-900">Kilit Noktalar</h3>
              </div>
              <ul className="space-y-2">
                {strategy.keyIssues.map((issue, index) => (
                  <li key={index} className="flex items-start text-sm text-yellow-700">
                    <span className="mr-2">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Strategy */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200 lg:col-span-2">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">🎯</span>
                <h3 className="text-sm font-semibold text-green-900">Önerilen Strateji</h3>
              </div>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{strategy.recommendedStrategy}</p>
            </div>

            {/* Risks */}
            {strategy.risks && strategy.risks.length > 0 && (
              <div className="bg-red-50 rounded-lg p-6 border border-red-200 lg:col-span-2">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">🚨</span>
                  <h3 className="text-sm font-semibold text-red-900">Riskler</h3>
                </div>
                <ul className="space-y-2">
                  {strategy.risks.map((risk, index) => (
                    <li key={index} className="flex items-start text-sm text-red-700">
                      <span className="mr-2">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sources */}
          {strategy.sources && strategy.sources.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Kaynaklar (Emsal Kararlar)
              </h3>
              <div className="space-y-3">
                {strategy.sources.map((source, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {source.title || 'Başlık Yok'}
                        </h4>
                        {source.court && (
                          <p className="text-xs text-gray-600 mt-1">
                            {source.court}
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
        </div>
      ) : (
        <div className="mt-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="mt-4 text-sm text-gray-600">
            Henüz strateji üretilmedi. Yukarıdan bir hukuk alanı seçip sorunuzu girin.
          </p>
        </div>
      )}
    </div>
  )
}

