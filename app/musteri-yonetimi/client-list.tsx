'use client'

import type { ClientWithStats } from './client-management-client'

interface ClientListProps {
  clients: ClientWithStats[]
  selectedClientId: string | null
  onSelectClient: (clientId: string) => void
  loading: boolean
  error: string | null
}

export default function ClientList({
  clients,
  selectedClientId,
  onSelectClient,
  loading,
  error,
}: ClientListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz müvekkil yok</h3>
          <p className="mt-1 text-sm text-gray-500">
            İlk müvekkilinizi eklemek için yukarıdaki butona tıklayın
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {clients.map((client) => (
        <button
          key={client.id}
          onClick={() => onSelectClient(client.id)}
          className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
            selectedClientId === client.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {client.full_name}
              </p>
              {client.email && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{client.phone}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            {client.openCasesCount > 0 && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-xs text-gray-600">{client.openCasesCount} açık dosya</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

