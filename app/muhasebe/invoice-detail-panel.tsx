'use client'

import { useState, useEffect } from 'react'
import type { InvoiceWithRelations, Payment } from '../../types/database'
import InstallmentsSection from './installments-section'
import CollectionAssistantModal from './collection-assistant-modal'

interface InvoiceDetailPanelProps {
  invoiceId: string
  onClose: () => void
  onPaymentAdded: () => void
}

export default function InvoiceDetailPanel({
  invoiceId,
  onClose,
  onPaymentAdded,
}: InvoiceDetailPanelProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingPayment, setAddingPayment] = useState(false)
  const [showCollectionAssistant, setShowCollectionAssistant] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    paid_at: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchInvoiceDetails()
  }, [invoiceId])

  const fetchInvoiceDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/accounting/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingPayment(true)

    try {
      const response = await fetch(`/api/accounting/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentForm,
          amount: parseFloat(paymentForm.amount),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ödeme eklenemedi')
      }

      // Reset form
      setPaymentForm({
        amount: '',
        payment_method: 'bank_transfer',
        paid_at: new Date().toISOString().split('T')[0],
        notes: '',
      })

      // Refresh invoice details
      await fetchInvoiceDetails()
      onPaymentAdded()
    } catch (error: any) {
      console.error('Error adding payment:', error)
      alert(error.message || 'Bir hata oluştu')
    } finally {
      setAddingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: invoice?.currency || 'TRY',
    }).format(amount)
  }

  const getTotalPaid = () => {
    return invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
  }

  const getRemainingAmount = () => {
    return (invoice?.amount || 0) - getTotalPaid()
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Taslak' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Gönderildi' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Kısmi Ödendi' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ödendi' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gecikmiş' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'İptal' },
    }

    const badge = badges[status] || badges.draft

    return (
      <span
        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Fatura Detayı</h2>
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

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Collection Assistant Button */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCollectionAssistant(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Tahsilat Asistanı (AI)
              </button>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Durum</span>
              {getStatusBadge(invoice.status)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Müşteri</span>
              <span className="text-sm text-gray-900">
                {invoice.client?.full_name || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Dosya</span>
              <span className="text-sm text-gray-900">{invoice.case?.title || '-'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Açıklama</span>
              <span className="text-sm text-gray-900">{invoice.description}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Toplam Tutar</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(invoice.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Ödenen</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(getTotalPaid())}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-600">Kalan</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(getRemainingAmount())}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Vade Tarihi</span>
              <span className="text-sm text-gray-900">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString('tr-TR')
                  : '-'}
              </span>
            </div>

            {invoice.paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ödeme Tarihi</span>
                <span className="text-sm text-gray-900">
                  {new Date(invoice.paid_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>

          {/* Payments List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ödemeler</h3>
            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.paid_at).toLocaleDateString('tr-TR')} •{' '}
                        {payment.payment_method === 'cash'
                          ? 'Nakit'
                          : payment.payment_method === 'bank_transfer'
                          ? 'Havale'
                          : payment.payment_method === 'credit_card'
                          ? 'Kredi Kartı'
                          : payment.payment_method === 'check'
                          ? 'Çek'
                          : 'Diğer'}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Henüz ödeme kaydı yok.
              </p>
            )}
          </div>

          {/* Installments Section */}
          <div className="border-t border-gray-200 pt-6">
            <InstallmentsSection
              invoiceId={invoiceId}
              invoiceAmount={invoice.amount}
              onInstallmentPaid={fetchInvoiceDetails}
            />
          </div>

          {/* Add Payment Form */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tek Seferlik Ödeme Ekle</h3>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tutar *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      max={getRemainingAmount()}
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                      }
                      placeholder={`Maks: ${formatCurrency(getRemainingAmount())}`}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Yöntemi
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, payment_method: e.target.value })
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="bank_transfer">Havale/EFT</option>
                      <option value="cash">Nakit</option>
                      <option value="credit_card">Kredi Kartı</option>
                      <option value="debit_card">Banka Kartı</option>
                      <option value="check">Çek</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paid_at}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paid_at: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    placeholder="Ödeme notu..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingPayment}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPayment ? 'Ekleniyor...' : 'Ödeme Ekle'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Collection Assistant Modal */}
      {showCollectionAssistant && (
        <CollectionAssistantModal
          invoice={invoice}
          onClose={() => setShowCollectionAssistant(false)}
        />
      )}
    </div>
  )
}

