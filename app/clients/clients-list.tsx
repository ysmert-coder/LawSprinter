'use client'

import { useState } from 'react'

interface Client {
  id: string
  full_name: string
  email: string
  phone: string | null
  type: string | null
  openCasesCount: number
  totalCasesCount: number
  created_at: string
}

interface ClientsListProps {
  clients: Client[]
  firmId: string
}

export default function ClientsList({ clients, firmId }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Clients List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Müvekkil ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Clients Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müvekkil
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açık Dosya
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Aktivite
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      onClick={() => setSelectedClient(client)}
                      className={`cursor-pointer transition-colors ${
                        selectedClient?.id === client.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {client.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                            {client.phone && (
                              <div className="text-xs text-gray-500">{client.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {client.type === 'corporate' ? 'Şirket' : 'Bireysel'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.openCasesCount}</div>
                        <div className="text-xs text-gray-500">Toplam: {client.totalCasesCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm 
                        ? 'Arama kriterlerine uygun müvekkil bulunamadı.'
                        : 'Henüz müvekkil bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client Detail & Messaging Panel */}
      <div className="lg:col-span-1">
        {selectedClient ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
            {/* Client Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-lg">
                    {selectedClient.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-white">{selectedClient.full_name}</h3>
                  <p className="text-sm text-indigo-100">{selectedClient.email}</p>
                </div>
              </div>
            </div>

            {/* Client Stats */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Açık Dosya</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedClient.openCasesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Toplam Dosya</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedClient.totalCasesCount}</p>
                </div>
              </div>
            </div>

            {/* Communication Panel */}
            <div className="px-6 py-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">İletişim & Otomasyon</h4>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-blue-900">Müşteri Profili Analizi</p>
                      <p className="text-xs text-blue-700 mt-1">
                        AI ile müşteri iletişim tarzı ve beklentileri analiz edilebilir
                      </p>
                      <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Analiz Et →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-900">Mesaj Taslağı Üret (AI)</p>
                      <p className="text-xs text-green-700 mt-1">
                        Dava durumu ve müşteri geçmişine göre otomatik mesaj taslağı
                      </p>
                      <button className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium">
                        Taslak Oluştur →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-purple-900">Mesaj Geçmişi</p>
                      <p className="text-xs text-purple-700 mt-1">
                        WhatsApp, e-posta ve diğer kanallardan gönderilen mesajlar
                      </p>
                      <button className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium">
                        Geçmişi Gör →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Not:</strong> Tüm mesajlar avukat onayı ile gönderilir. Otomatik gönderim yapılmaz.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">
              Detayları görmek için bir müvekkil seçin
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

