'use client'

import { useState, useEffect } from 'react'
import ClientList from './client-list'
import ClientDetailView from './client-detail-view'
import NewClientModal from './new-client-modal'

export interface ClientWithStats {
  id: string
  firm_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  openCasesCount: number
  totalCasesCount: number
  lastActivityDate: string | null
}

export default function ClientManagementClient() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/clients?stats=true')

      if (!response.ok) {
        throw new Error('Müşteriler yüklenemedi')
      }

      const data = await response.json()
      setClients(data)

      // Auto-select first client if none selected
      if (!selectedClientId && data.length > 0) {
        setSelectedClientId(data[0].id)
      }
    } catch (err: any) {
      console.error('Clients fetch error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleClientCreated = () => {
    setShowNewClientModal(false)
    fetchClients()
  }

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Client List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* New Client Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yeni Müvekkil Ekle
          </button>
        </div>

        {/* Client List */}
        <ClientList
          clients={filteredClients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          loading={loading}
          error={error}
        />
      </div>

      {/* Right Panel - Client Detail */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {selectedClientId ? (
          <ClientDetailView
            clientId={selectedClientId}
            onClientUpdated={fetchClients}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Müvekkil Seçin</h3>
              <p className="mt-1 text-sm text-gray-500">
                Detayları görmek için soldan bir müvekkil seçin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onSuccess={handleClientCreated}
        />
      )}
    </div>
  )
}

