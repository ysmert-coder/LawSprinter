'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../supabase'

interface Client {
  id: string
  full_name: string
  email: string
}

interface NewCaseModalProps {
  clients: Client[]
  firmId: string
}

export default function NewCaseModal({ clients, firmId }: NewCaseModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'civil',
    client_id: '',
    description: '',
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('cases')
        .insert({
          firm_id: firmId,
          title: formData.title,
          type: formData.type,
          client_id: formData.client_id || null,
          status: 'open',
        } as any)

      if (insertError) throw insertError

      // Reset form and close modal
      setFormData({
        title: '',
        type: 'civil',
        client_id: '',
        description: '',
      })
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Error creating case:', err)
      setError(err.message || 'Dosya oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yeni Dosya Oluştur
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={() => setIsOpen(false)}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Yeni Dosya Oluştur
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Dosya Başlığı *
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Örn: ABC Ltd. İş Davası"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Dosya Türü *
                      </label>
                      <select
                        id="type"
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="civil">Hukuk</option>
                        <option value="criminal">Ceza</option>
                        <option value="administrative">İdari</option>
                        <option value="commercial">Ticaret</option>
                        <option value="labor">İş</option>
                        <option value="family">Aile</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>

                    {/* Client */}
                    <div>
                      <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Müvekkil
                      </label>
                      <select
                        id="client_id"
                        value={formData.client_id}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="">Müvekkil seçin (opsiyonel)</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.full_name} {client.email && `(${client.email})`}
                          </option>
                        ))}
                      </select>
                      {clients.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Henüz müvekkil eklenmemiş. Önce müvekkil ekleyebilirsiniz.
                        </p>
                      )}
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
                {loading ? 'Oluşturuluyor...' : 'Dosya Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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

