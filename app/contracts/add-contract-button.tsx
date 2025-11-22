'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Case {
  id: string
  title: string
  status: string
}

interface AddContractButtonProps {
  cases: Case[]
}

export default function AddContractButton({ cases }: AddContractButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    caseId: '',
    contractType: 'service',
    startDate: '',
    expiryDate: '',
    autoRenewal: false,
    renewalNoticeDays: '30',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Sözleşme eklenemedi')
      }

      setIsOpen(false)
      setFormData({
        caseId: '',
        contractType: 'service',
        startDate: '',
        expiryDate: '',
        autoRenewal: false,
        renewalNoticeDays: '30',
        notes: '',
      })
      router.refresh()
    } catch (error) {
      console.error('Error adding contract:', error)
      alert('Sözleşme eklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Sözleşme Ekle
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Yeni Sözleşme Ekle
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="bg-white px-6 py-4 space-y-4">
                  {/* Case selection */}
                  <div>
                    <label htmlFor="caseId" className="block text-sm font-medium text-gray-700 mb-1">
                      Dosya *
                    </label>
                    <select
                      id="caseId"
                      name="caseId"
                      required
                      value={formData.caseId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="">Dosya seçin</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contract type */}
                  <div>
                    <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-1">
                      Sözleşme Türü *
                    </label>
                    <select
                      id="contractType"
                      name="contractType"
                      required
                      value={formData.contractType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="service">Hizmet Sözleşmesi</option>
                      <option value="rental">Kira Sözleşmesi</option>
                      <option value="employment">İş Sözleşmesi</option>
                      <option value="nda">Gizlilik Sözleşmesi</option>
                      <option value="partnership">Ortaklık Sözleşmesi</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Tarihi *
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Tarihi *
                      </label>
                      <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        required
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Auto renewal */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoRenewal"
                      name="autoRenewal"
                      checked={formData.autoRenewal}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
                    />
                    <label htmlFor="autoRenewal" className="ml-2 text-sm text-gray-700">
                      Otomatik yenileme
                    </label>
                  </div>

                  {/* Renewal notice days */}
                  <div>
                    <label htmlFor="renewalNoticeDays" className="block text-sm font-medium text-gray-700 mb-1">
                      Yenileme Hatırlatma (gün önce)
                    </label>
                    <input
                      type="number"
                      id="renewalNoticeDays"
                      name="renewalNoticeDays"
                      min="1"
                      max="365"
                      value={formData.renewalNoticeDays}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
                      placeholder="Sözleşme hakkında notlar..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Ekleniyor...' : 'Sözleşme Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

