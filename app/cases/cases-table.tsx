'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Case {
  id: string
  title: string
  type: string
  status: string
  created_at: string
  updated_at: string
  clients?: {
    id: string
    full_name: string
    email: string
  }
  deadlines?: Array<{
    date: string
    critical_level: string
  }>
}

interface CasesTableProps {
  cases: Case[]
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
  archived: 'bg-blue-100 text-blue-800',
}

const statusLabels = {
  open: 'Aktif',
  pending: 'Beklemede',
  closed: 'Kapalı',
  archived: 'Arşiv',
}

const typeLabels = {
  civil: 'Hukuk',
  criminal: 'Ceza',
  administrative: 'İdari',
  commercial: 'Ticaret',
  labor: 'İş',
  family: 'Aile',
  other: 'Diğer',
}

export default function CasesTable({ cases }: CasesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Get next deadline for a case
  const getNextDeadline = (caseItem: Case) => {
    if (!caseItem.deadlines || caseItem.deadlines.length === 0) return null
    
    const today = new Date()
    const futureDeadlines = caseItem.deadlines
      .filter(d => new Date(d.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return futureDeadlines[0] || null
  }

  // Calculate days until deadline
  const getDaysUntil = (dateStr: string) => {
    const deadline = new Date(dateStr)
    const today = new Date()
    const diff = deadline.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
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
                placeholder="Dosya veya müvekkil ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="open">Aktif</option>
              <option value="pending">Beklemede</option>
              <option value="closed">Kapalı</option>
              <option value="archived">Arşiv</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dosya
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müvekkil
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tür
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Tarih
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Aktivite
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCases.length > 0 ? (
              filteredCases.map((caseItem) => {
                const nextDeadline = getNextDeadline(caseItem)
                const lastActivity = new Date(caseItem.updated_at).toLocaleDateString('tr-TR')
                
                return (
                  <tr key={caseItem.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseItem.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caseItem.clients?.full_name || '-'}
                      </div>
                      {caseItem.clients?.email && (
                        <div className="text-xs text-gray-500">
                          {caseItem.clients.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {typeLabels[caseItem.type as keyof typeof typeLabels] || caseItem.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[caseItem.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusLabels[caseItem.status as keyof typeof statusLabels] || caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {nextDeadline ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(nextDeadline.date).toLocaleDateString('tr-TR')}
                          </div>
                          <div className={`text-xs ${
                            getDaysUntil(nextDeadline.date) <= 3 ? 'text-red-600 font-medium' :
                            getDaysUntil(nextDeadline.date) <= 7 ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {getDaysUntil(nextDeadline.date)} gün kaldı
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lastActivity}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Arama kriterlerine uygun dosya bulunamadı.'
                    : 'Henüz dosya bulunmuyor.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">
          Toplam <span className="font-medium">{filteredCases.length}</span> dosya gösteriliyor
          {(searchTerm || statusFilter !== 'all') && (
            <span className="text-gray-500"> (Toplam {cases.length} dosyadan)</span>
          )}
        </div>
      </div>
    </div>
  )
}

