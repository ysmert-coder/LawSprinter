'use client'

/**
 * RAG Import Form Component
 * 
 * Client-side form for uploading documents
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LegalArea = 'ceza' | 'borçlar' | 'icra_iflas' | 'medeni' | 'ticaret' | 'anayasa' | 'genel'
type DocumentType = 'kanun' | 'içtihat' | 'makale' | 'genel'

const LEGAL_AREAS: { value: LegalArea; label: string }[] = [
  { value: 'ceza', label: 'Ceza Hukuku' },
  { value: 'borçlar', label: 'Borçlar Hukuku' },
  { value: 'icra_iflas', label: 'İcra-İflas Hukuku' },
  { value: 'medeni', label: 'Medeni Hukuk' },
  { value: 'ticaret', label: 'Ticaret Hukuku' },
  { value: 'anayasa', label: 'Anayasa Hukuku' },
  { value: 'genel', label: 'Genel / Diğer' },
]

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'kanun', label: 'Kanun/Mevzuat' },
  { value: 'içtihat', label: 'İçtihat/Karar' },
  { value: 'makale', label: 'Makale/Doktrin' },
  { value: 'genel', label: 'Genel Doküman' },
]

export default function RAGImportForm() {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<LegalArea>('genel')
  const [docType, setDocType] = useState<DocumentType>('genel')
  const [court, setCourt] = useState('')
  const [year, setYear] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)
    setSuccess(null)

    // Auto-fill title from filename if empty
    if (selectedFile && !title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setTitle(nameWithoutExt)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validation
      if (!file) {
        setError('Lütfen bir dosya seçin')
        return
      }

      if (!title.trim()) {
        setError('Lütfen bir başlık girin')
        return
      }

      // Check file size (10MB max)
      const MAX_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_SIZE) {
        setError('Dosya boyutu 10MB\'tan büyük olamaz')
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('area', area)
      formData.append('docType', docType)
      if (court.trim()) {
        formData.append('court', court.trim())
      }
      if (year.trim()) {
        formData.append('year', year.trim())
      }

      // Submit to API
      const response = await fetch('/api/rag/import/public', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Yükleme başarısız'
        const details = data.details ? ` (Detay: ${data.details})` : ''
        const hint = data.hint ? ` ${data.hint}` : ''
        throw new Error(`${errorMsg}${details}${hint}`)
      }

      // Success
      setSuccess(
        `✅ Doküman başarıyla eklendi! ${data.chunksInserted} chunk oluşturuldu. ` +
          `Metin uzunluğu: ${data.textLength} karakter. ` +
          `Tüm AI asistanlar artık bu dokümanı kullanabilir.`
      )

      // Reset form
      setFile(null)
      setTitle('')
      setArea('genel')
      setDocType('genel')
      setCourt('')
      setYear('')

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('[RAG Import Form] Error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosya Seç <span className="text-red-500">*</span>
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
          />
          {file && (
            <p className="mt-2 text-xs text-gray-600">
              Seçili dosya: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Başlık <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Yargıtay 12. HD. 2023/1234 E. 2023/5678 K."
            disabled={loading}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Legal Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hukuk Alanı <span className="text-red-500">*</span>
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as LegalArea)}
            disabled={loading}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          >
            {LEGAL_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doküman Tipi <span className="text-red-500">*</span>
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            disabled={loading}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          >
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Court (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mahkeme (Opsiyonel)</label>
          <input
            type="text"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            placeholder="Örn: Yargıtay 12. Hukuk Dairesi"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Year (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Yıl (Opsiyonel)</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Örn: 2023"
            min="1900"
            max={new Date().getFullYear()}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || !file || !title.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                İşleniyor...
              </>
            ) : (
              '📤 Dokümanı İçe Aktar'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

