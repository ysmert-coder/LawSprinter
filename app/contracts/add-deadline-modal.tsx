'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../supabase'

interface Contract {
  id: string
  expiry_date: string | null
  notice_period_days: number | null
  case_id: string | null
  cases?: {
    id: string
    title: string
  }
}

interface AddDeadlineModalProps {
  contract: Contract
  onClose: () => void
}

export default function AddDeadlineModal({ contract, onClose }: AddDeadlineModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate suggested deadline date (expiry_date - notice_period_days)
  const getSuggestedDate = () => {
    if (!contract.expiry_date) return ''
    
    const expiryDate = new Date(contract.expiry_date)
    const noticeDays = contract.notice_period_days || 30 // Default 30 days
    const suggestedDate = new Date(expiryDate.getTime() - noticeDays * 24 * 60 * 60 * 1000)
    
    return suggestedDate.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    date: getSuggestedDate(),
    type: 'Sözleşme Yenileme',
    description: `${contract.cases?.title || 'Sözleşme'} yenileme süresi`,
    critical_level: 'high',
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get user's firm_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single<{ firm_id: string }>()

      if (!profile?.firm_id) throw new Error('No firm associated')

      const { error: insertError } = await supabase
        .from('deadlines')
        .insert({
          firm_id: profile.firm_id,
          case_id: contract.case_id,
          date: formData.date,
          type: formData.type,
          description: formData.description,
          critical_level: formData.critical_level,
        } as any)

      if (insertError) throw insertError

      onClose()
      router.refresh()
    } catch (err: any) {
      console.error('Error creating deadline:', err)
      setError(err.message || 'Süre oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Yenileme Süresi Ekle
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Sözleşme:</strong> {contract.cases?.title || 'Bilinmiyor'}
                    </p>
                    {contract.expiry_date && (
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Bitiş Tarihi:</strong> {new Date(contract.expiry_date).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                    {contract.notice_period_days && (
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>İhbar Süresi:</strong> {contract.notice_period_days} gün
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Date */}
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Yenileme Son Tarihi *
                      </label>
                      <input
                        type="date"
                        id="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Önerilen tarih: İhbar süresi kadar önce
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Süre Türü
                      </label>
                      <input
                        type="text"
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>

                    {/* Critical Level */}
                    <div>
                      <label htmlFor="critical_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Öncelik Seviyesi *
                      </label>
                      <select
                        id="critical_level"
                        required
                        value={formData.critical_level}
                        onChange={(e) => setFormData({ ...formData, critical_level: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                        <option value="critical">Kritik</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ekleniyor...' : 'Süre Ekle'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

