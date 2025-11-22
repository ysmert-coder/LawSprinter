'use client'

import { useState } from 'react'
import type { InvoiceInstallment } from '../../types/database'

interface MarkInstallmentPaidModalProps {
  installment: InvoiceInstallment
  onClose: () => void
  onSuccess: () => void
}

export default function MarkInstallmentPaidModal({
  installment,
  onClose,
  onSuccess,
}: MarkInstallmentPaidModalProps) {
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState(installment.note || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(
        `/api/accounting/installments/${installment.id}/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paidAt: new Date(paidAt).toISOString(),
            note: note || undefined,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ödeme işaretlenemedi')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error marking installment as paid:', error)
      setError(error.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    const currencyConfig: Record<string, { locale: string; currency: string }> = {
      TRY: { locale: 'tr-TR', currency: 'TRY' },
      USD: { locale: 'en-US', currency: 'USD' },
      EUR: { locale: 'de-DE', currency: 'EUR' },
      GBP: { locale: 'en-GB', currency: 'GBP' },
    }

    const config = currencyConfig[currency] || currencyConfig.TRY

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Taksit Ödemesi</h2>
          <p className="text-sm text-gray-600 mt-1">
            Taksiti ödendi olarak işaretleyin
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Installment Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Vade Tarihi</span>
              <span className="text-sm text-gray-900">
                {new Date(installment.due_date).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Tutar</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(installment.amount, installment.currency)}
                </span>
                <span className="text-xs text-gray-500 ml-2">{installment.currency}</span>
              </div>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Tarihi *
            </label>
            <input
              type="date"
              required
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Not
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ödeme notu (opsiyonel)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'İşaretleniyor...' : 'Ödendi İşaretle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

