'use client'

import { useState } from 'react'

interface Deadline {
  id: string
  date: string
  type: string
  description: string
  critical_level: string
  created_at: string
  cases?: {
    id: string
    title: string
    type: string
    status: string
  }
}

interface DeadlinesTableProps {
  deadlines: Deadline[]
}

const criticalLevelColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
}

const criticalLevelLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
}

export default function DeadlinesTable({ deadlines }: DeadlinesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter deadlines
  const filteredDeadlines = deadlines.filter(d => {
    const matchesSearch = 
      d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cases?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPriority = priorityFilter === 'all' || d.critical_level === priorityFilter

    return matchesSearch && matchesPriority
  })

  // Calculate days until deadline
  const getDaysUntil = (dateStr: string) => {
    const deadline = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadline.setHours(0, 0, 0, 0)
    const diff = deadline.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Get status badge for days remaining
  const getStatusBadge = (daysUntil: number) => {
    if (daysUntil < 0) {
      return { text: 'Gecikmiş', color: 'bg-red-100 text-red-800' }
    } else if (daysUntil === 0) {
      return { text: 'Bugün', color: 'bg-red-100 text-red-800' }
    } else if (daysUntil <= 3) {
      return { text: `${daysUntil} gün kaldı`, color: 'bg-red-100 text-red-800' }
    } else if (daysUntil <= 7) {
      return { text: `${daysUntil} gün kaldı`, color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { text: `${daysUntil} gün kaldı`, color: 'bg-green-100 text-green-800' }
    }
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
                placeholder="Süre veya dosya ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Priority Filter */}
          <div className="sm:w-48">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="critical">Kritik</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
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
                Son Tarih
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Açıklama
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dosya
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Öncelik
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDeadlines.length > 0 ? (
              filteredDeadlines.map((deadline) => {
                const daysUntil = getDaysUntil(deadline.date)
                const statusBadge = getStatusBadge(daysUntil)
                
                return (
                  <tr key={deadline.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(deadline.date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(deadline.date).toLocaleDateString('tr-TR', { weekday: 'long' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {deadline.description || '-'}
                      </div>
                      {deadline.type && (
                        <div className="text-xs text-gray-500 mt-1">
                          {deadline.type}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {deadline.cases?.title || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        criticalLevelColors[deadline.critical_level as keyof typeof criticalLevelColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {criticalLevelLabels[deadline.critical_level as keyof typeof criticalLevelLabels] || deadline.critical_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || priorityFilter !== 'all' 
                    ? 'Arama kriterlerine uygun süre bulunamadı.'
                    : 'Henüz süre bulunmuyor.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">
          Toplam <span className="font-medium">{filteredDeadlines.length}</span> süre gösteriliyor
          {(searchTerm || priorityFilter !== 'all') && (
            <span className="text-gray-500"> (Toplam {deadlines.length} süreden)</span>
          )}
        </div>
      </div>
    </div>
  )
}

