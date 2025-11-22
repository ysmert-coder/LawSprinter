'use client'

import { useState } from 'react'
import type { InvoiceInstallmentInput } from '../../types/database'

interface CreateInstallmentsModalProps {
  invoiceId: string
  invoiceAmount: number
  onClose: () => void
  onSuccess: () => void
}

interface InstallmentRow {
  id: string
  dueDate: string
  amount: string
  currency: string
  note: string
}

export default function CreateInstallmentsModal({
  invoiceId,
  invoiceAmount,
  onClose,
  onSuccess,
}: CreateInstallmentsModalProps) {
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('TRY')
  const [rows, setRows] = useState<InstallmentRow[]>([
    {
      id: crypto.randomUUID(),
      dueDate: '',
      amount: '',
      currency: 'TRY',
      note: '',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        dueDate: '',
        amount: '',
        currency: invoiceCurrency,
        note: '',
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof InstallmentRow, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const getTotalAmount = () => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    for (const row of rows) {
      if (!row.dueDate || !row.amount) {
        setError('Tüm satırlar için vade tarihi ve tutar girilmelidir')
        return
      }

      if (parseFloat(row.amount) <= 0) {
        setError('Tutar 0\'dan büyük olmalıdır')
        return
      }
    }

    const totalAmount = getTotalAmount()
    if (Math.abs(totalAmount - invoiceAmount) > 0.01) {
      const confirmMessage = `Toplam taksit tutarı (${totalAmount.toFixed(
        2
      )} ₺) fatura tutarından (${invoiceAmount.toFixed(
        2
      )} ₺) farklı. Devam etmek istiyor musunuz?`

      if (!confirm(confirmMessage)) {
        return
      }
    }

    setLoading(true)

    try {
      const installments: InvoiceInstallmentInput[] = rows.map((row) => ({
        dueDate: new Date(row.dueDate).toISOString(),
        amount: parseFloat(row.amount),
        currency: row.currency as any,
        note: row.note || undefined,
      }))

      const response = await fetch(`/api/accounting/invoices/${invoiceId}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installments }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ödeme planı oluşturulamadı')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error creating installments:', error)
      setError(error.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ödeme Planı Oluştur</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fatura Tutarı: {invoiceAmount.toFixed(2)} ₺
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Installment Rows */}
          <div className="space-y-3 mb-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Vade Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={row.dueDate}
                      onChange={(e) => updateRow(row.id, 'dueDate', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tutar *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Para Birimi *
                    </label>
                    <select
                      value={row.currency}
                      onChange={(e) => updateRow(row.id, 'currency', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="TRY">₺ TRY</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Not
                    </label>
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => updateRow(row.id, 'note', e.target.value)}
                      placeholder="Opsiyonel"
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="flex-shrink-0 mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Satırı Sil"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={addRow}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            + Taksit Ekle
          </button>

          {/* Summary */}
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Toplam Taksit Tutarı:</span>
              <span className="text-lg font-bold text-indigo-600">
                {getTotalAmount().toFixed(2)} ₺
              </span>
            </div>
            {Math.abs(getTotalAmount() - invoiceAmount) > 0.01 && (
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Toplam tutar fatura tutarından farklı
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Oluşturuluyor...' : 'Ödeme Planı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

