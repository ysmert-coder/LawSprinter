'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddDeadlineModal from './add-deadline-modal'

interface Contract {
  id: string
  expiry_date: string | null
  notice_period_days: number | null
  risk_score: number | null
  summary_for_lawyer: string | null
  summary_for_client: string | null
  created_at: string
  case_id: string | null
  cases?: {
    id: string
    title: string
    type: string
  }
  documents?: {
    id: string
    title: string
    storage_path: string
  }
}

interface ContractsTableProps {
  contracts: Contract[]
}

export default function ContractsTable({ contracts }: ContractsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [selectedContractForDeadline, setSelectedContractForDeadline] = useState<Contract | null>(null)
  const router = useRouter()

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.cases?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documents?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Calculate days until expiry
  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null
    const expiry = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    const diff = expiry.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Get status based on days remaining
  const getStatus = (daysUntil: number | null) => {
    if (daysUntil === null) return { text: 'Tarih Yok', color: 'bg-gray-100 text-gray-800' }
    if (daysUntil < 0) return { text: 'Süresi Dolmuş', color: 'bg-red-100 text-red-800' }
    if (daysUntil === 0) return { text: 'Bugün Bitiyor', color: 'bg-red-100 text-red-800' }
    if (daysUntil <= 30) return { text: 'Yenileme Yaklaşıyor', color: 'bg-yellow-100 text-yellow-800' }
    if (daysUntil <= 60) return { text: 'İnceleme Gerekli', color: 'bg-blue-100 text-blue-800' }
    return { text: 'Aktif', color: 'bg-green-100 text-green-800' }
  }

  // Handle AI analysis
  const handleAnalyze = async (contractId: string) => {
    setAnalyzingId(contractId)
    try {
      const response = await fetch('/api/contracts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Sözleşme analizi başlatıldı')
        if (data.warning) {
          console.warn(data.warning)
        }
      } else {
        alert(data.error || 'Analiz başlatılamadı')
      }
    } catch (error) {
      console.error('Error analyzing contract:', error)
      alert('Bir hata oluştu')
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Sözleşme veya dosya ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sözleşme Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosya
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bitiş Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kalan Gün
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => {
                  const daysUntil = getDaysUntilExpiry(contract.expiry_date)
                  const status = getStatus(daysUntil)
                  
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.documents?.title || contract.cases?.title || 'Sözleşme'}
                        </div>
                        {contract.risk_score !== null && (
                          <div className="text-xs text-gray-500 mt-1">
                            Risk Skoru: {contract.risk_score}/100
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.cases?.title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.expiry_date 
                            ? new Date(contract.expiry_date).toLocaleDateString('tr-TR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          daysUntil === null ? 'text-gray-400' :
                          daysUntil < 0 ? 'text-red-600' :
                          daysUntil <= 30 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {daysUntil === null ? '-' : 
                           daysUntil < 0 ? `${Math.abs(daysUntil)} gün geçti` :
                           `${daysUntil} gün`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleAnalyze(contract.id)}
                          disabled={analyzingId === contract.id}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {analyzingId === contract.id ? (
                            <>
                              <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analiz Ediliyor...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI ile Analiz Et
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedContractForDeadline(contract)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Yenileme Süresi Ekle
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm 
                      ? 'Arama kriterlerine uygun sözleşme bulunamadı.'
                      : 'Henüz sözleşme bulunmuyor.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Toplam <span className="font-medium">{filteredContracts.length}</span> sözleşme gösteriliyor
            {searchTerm && (
              <span className="text-gray-500"> (Toplam {contracts.length} sözleşmeden)</span>
            )}
          </div>
        </div>
      </div>

      {/* Add Deadline Modal */}
      {selectedContractForDeadline && (
        <AddDeadlineModal
          contract={selectedContractForDeadline}
          onClose={() => setSelectedContractForDeadline(null)}
        />
      )}
    </>
  )
}

