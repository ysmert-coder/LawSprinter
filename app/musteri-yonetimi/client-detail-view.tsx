'use client'

import { useState, useEffect } from 'react'
import ClientMessagesTimeline from './client-messages-timeline'

interface ClientDetailViewProps {
  clientId: string
  onClientUpdated: () => void
}

interface ClientDetail {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  notes?: string | null
  created_at: string
  profile?: {
    sentiment_score?: number | null
    risk_level?: string | null
    communication_style?: string | null
    emotional_state?: string | null
  } | null
  open_cases: Array<{
    id: string
    title: string
    case_type: string
    status: string
    updated_at: string
  }>
  open_cases_count: number
  total_invoiced: number
  total_paid: number
}

export default function ClientDetailView({ clientId, onClientUpdated }: ClientDetailViewProps) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClientDetail()
  }, [clientId])

  const fetchClientDetail = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}`)

      if (!response.ok) {
        throw new Error('Müvekkil detayları yüklenemedi')
      }

      const data = await response.json()
      setClient(data)
    } catch (err: any) {
      console.error('Client detail fetch error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (score?: number | null) => {
    if (!score) return '😐'
    if (score > 0.3) return '😊'
    if (score < -0.3) return '😟'
    return '😐'
  }

  const getRiskBadge = (level?: string | null) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Düşük Risk' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Orta Risk' },
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'Yüksek Risk' },
    }

    const badge = level ? badges[level] : null

    if (!badge) return null

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Müvekkil bulunamadı'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {/* Header - Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{client.full_name}</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{client.phone}</span>
                  </div>
                )}
                {client.whatsapp_number && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-sm text-gray-600">{client.whatsapp_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Badges */}
            {client.profile && (
              <div className="flex flex-col items-end gap-2">
                <div className="text-3xl">{getSentimentIcon(client.profile.sentiment_score)}</div>
                {getRiskBadge(client.profile.risk_level)}
                {client.profile.communication_style && (
                  <p className="text-xs text-gray-600 text-right max-w-xs">
                    {client.profile.communication_style}
                  </p>
                )}
              </div>
            )}
          </div>

          {client.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Açık Dosya</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{client.open_cases_count}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Toplam Fatura</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(client.total_invoiced)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(client.total_paid)}
            </p>
          </div>
        </div>

        {/* Open Cases */}
        {client.open_cases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Açık Dosyalar</h3>
            <div className="space-y-3">
              {client.open_cases.map((case_) => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{case_.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {case_.case_type} • {case_.status}
                    </p>
                  </div>
                  <a
                    href={`/cases/${case_.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Detay →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Timeline */}
        <ClientMessagesTimeline clientId={clientId} />
      </div>
    </div>
  )
}

