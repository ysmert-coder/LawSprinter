'use client'

import { useState } from 'react'
import type { InvoiceWithRelations } from '../../types/database'

interface CollectionAssistantModalProps {
  invoice: InvoiceWithRelations
  onClose: () => void
}

type Channel = 'email' | 'whatsapp' | 'sms'
type Tone = 'soft' | 'neutral' | 'firm'

interface CollectionResponse {
  channel: Channel
  subject?: string
  message: string
  alternativeMessages?: string[]
  nextSteps?: string[]
  suggestedSendTime?: string
}

export default function CollectionAssistantModal({
  invoice,
  onClose,
}: CollectionAssistantModalProps) {
  const [channel, setChannel] = useState<Channel>('email')
  const [tone, setTone] = useState<Tone>('neutral')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CollectionResponse | null>(null)
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/accounting/collection-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: invoice.client_id,
          invoiceIds: [invoice.id],
          preferredChannel: channel,
          tone,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Tahsilat mesajı oluşturulamadı')
      }

      const data = await res.json()
      setResponse(data)
    } catch (error: any) {
      console.error('Collection assistant error:', error)
      setError(
        error.message ||
          'Tahsilat asistanı şu an çalışmıyor, lütfen daha sonra tekrar deneyin.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(label)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const getCurrentMessage = () => {
    if (!response) return ''
    if (selectedMessageIndex === 0) return response.message
    if (response.alternativeMessages && response.alternativeMessages[selectedMessageIndex - 1]) {
      return response.alternativeMessages[selectedMessageIndex - 1]
    }
    return response.message
  }

  const getTotalMessageCount = () => {
    if (!response) return 0
    return 1 + (response.alternativeMessages?.length || 0)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tahsilat Asistanı</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI destekli tahsilat mesajı oluşturun
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {!response ? (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fatura Bilgileri</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Müvekkil:</span>{' '}
                    {invoice.client_name || 'Belirtilmemiş'}
                  </p>
                  <p>
                    <span className="font-medium">Açıklama:</span> {invoice.description}
                  </p>
                  <p>
                    <span className="font-medium">Tutar:</span>{' '}
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: invoice.currency || 'TRY',
                    }).format(invoice.amount)}
                  </p>
                  <p>
                    <span className="font-medium">Durum:</span>{' '}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status === 'paid'
                        ? 'Ödendi'
                        : invoice.status === 'overdue'
                        ? 'Gecikmiş'
                        : invoice.status === 'sent'
                        ? 'Gönderildi'
                        : 'Taslak'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İletişim Kanalı *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'email', label: 'E-posta', icon: '📧' },
                    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                    { value: 'sms', label: 'SMS', icon: '📱' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChannel(option.value as Channel)}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        channel === option.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesaj Tonu *
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="soft">Yumuşak (Nazik hatırlatma)</option>
                  <option value="neutral">Nötr (Standart iş dili)</option>
                  <option value="firm">Sıkı (Resmi ve ciddi)</option>
                </select>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Önemli:</strong> Bu araç sadece taslak mesaj üretir. Lütfen
                  göndermeden önce mesajı kontrol edin ve gerekli düzenlemeleri yapın.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mesaj Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Mesaj Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Response Display */
            <div className="space-y-4">
              {/* Subject (Email only) */}
              {response.channel === 'email' && response.subject && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Konu</label>
                    <button
                      onClick={() => handleCopy(response.subject!, 'subject')}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      {copySuccess === 'subject' ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={response.subject}
                    className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* Message Tabs */}
              {getTotalMessageCount() > 1 && (
                <div className="flex items-center gap-2 border-b border-gray-200">
                  {Array.from({ length: getTotalMessageCount() }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMessageIndex(index)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        selectedMessageIndex === index
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {index === 0 ? 'Ana Mesaj' : `Alternatif ${index}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Mesaj</label>
                  <button
                    onClick={() => handleCopy(getCurrentMessage(), 'message')}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    {copySuccess === 'message' ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Kopyala
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={getCurrentMessage()}
                  rows={12}
                  className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono whitespace-pre-wrap"
                />
              </div>

              {/* Next Steps */}
              {response.nextSteps && response.nextSteps.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Ek Öneriler</h4>
                  <ul className="space-y-1">
                    {response.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Send Time */}
              {response.suggestedSendTime && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Önerilen gönderim zamanı:</span>{' '}
                    {new Date(response.suggestedSendTime).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Taslak mesajdır.</strong> Lütfen göndermeden önce kontrol edin
                  ve gerekli düzenlemeleri yapın.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

