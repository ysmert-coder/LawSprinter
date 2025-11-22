'use client'

import { useState, useEffect } from 'react'
import type { InvoiceInstallment, InvoiceInstallmentInput } from '../../types/database'
import CreateInstallmentsModal from './create-installments-modal'
import MarkInstallmentPaidModal from './mark-installment-paid-modal'

interface InstallmentsSectionProps {
  invoiceId: string
  invoiceAmount: number
  onInstallmentPaid: () => void
}

export default function InstallmentsSection({
  invoiceId,
  invoiceAmount,
  onInstallmentPaid,
}: InstallmentsSectionProps) {
  const [installments, setInstallments] = useState<InvoiceInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<InvoiceInstallment | null>(null)

  useEffect(() => {
    fetchInstallments()
  }, [invoiceId])

  const fetchInstallments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/accounting/invoices/${invoiceId}/installments`)
      if (response.ok) {
        const data = await response.json()
        setInstallments(data)
      }
    } catch (error) {
      console.error('Error fetching installments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallmentsCreated = () => {
    setShowCreateModal(false)
    fetchInstallments()
  }

  const handleInstallmentPaid = () => {
    setSelectedInstallment(null)
    fetchInstallments()
    onInstallmentPaid()
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bekliyor' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ödendi' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gecikmiş' },
    }

    const badge = badges[status] || badges.pending

    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    )
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

  const getCurrencySymbol = (currency: string = 'TRY') => {
    const symbols: Record<string, string> = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
      GBP: '£',
    }
    return symbols[currency] || '₺'
  }

  const getTotalsByCurrency = () => {
    const totals: Record<string, { paid: number; remaining: number; total: number }> = {}

    installments.forEach((inst) => {
      const currency = inst.currency || 'TRY'
      if (!totals[currency]) {
        totals[currency] = { paid: 0, remaining: 0, total: 0 }
      }

      totals[currency].total += inst.amount

      if (inst.status === 'paid') {
        totals[currency].paid += inst.amount
      } else {
        totals[currency].remaining += inst.amount
      }
    })

    return totals
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ödeme Planı / Taksitler</h3>
        {installments.length === 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ödeme Planı Oluştur
          </button>
        )}
      </div>

      {installments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Bu fatura için tanımlı bir ödeme planı yok.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Taksitli ödeme planı oluşturmak için yukarıdaki butona tıklayın.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Toplam Taksit</p>
              <p className="text-lg font-semibold text-gray-900">{installments.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Ödenen</p>
              {Object.entries(getTotalsByCurrency()).map(([currency, totals]) => (
                <p key={`paid-${currency}`} className="text-sm font-semibold text-green-600">
                  {formatCurrency(totals.paid, currency)}
                </p>
              ))}
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Kalan</p>
              {Object.entries(getTotalsByCurrency()).map(([currency, totals]) => (
                <p key={`remaining-${currency}`} className="text-sm font-semibold text-yellow-600">
                  {formatCurrency(totals.remaining, currency)}
                </p>
              ))}
            </div>
          </div>

          {/* Installments Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vade Tarihi
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar / Para Birimi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödendi Tarihi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Not
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {installments.map((installment) => (
                  <tr
                    key={installment.id}
                    className={`hover:bg-gray-50 ${
                      installment.status === 'overdue' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(installment.amount, installment.currency)}
                      </div>
                      <div className="text-xs text-gray-500">{installment.currency}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(installment.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {installment.paid_at
                        ? new Date(installment.paid_at).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="max-w-xs truncate">{installment.note || '-'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {installment.status !== 'paid' && (
                        <button
                          onClick={() => setSelectedInstallment(installment)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ödendi İşaretle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateInstallmentsModal
          invoiceId={invoiceId}
          invoiceAmount={invoiceAmount}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleInstallmentsCreated}
        />
      )}

      {selectedInstallment && (
        <MarkInstallmentPaidModal
          installment={selectedInstallment}
          onClose={() => setSelectedInstallment(null)}
          onSuccess={handleInstallmentPaid}
        />
      )}
    </div>
  )
}

