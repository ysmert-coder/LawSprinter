'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface MonthlyCaseStats {
  openedThisMonth: number
  closedThisMonth: number
  totalActive: number
}

interface MonthlyFinanceStats {
  invoicedThisMonth: number
  collectedThisMonth: number
  pendingReceivables: number
  currency: string
}

interface CaseDistributionByStatus {
  status: string
  count: number
  label: string
}

interface CaseDistributionByType {
  caseType: string
  count: number
  label: string
}

interface CaseDistribution {
  byStatus: CaseDistributionByStatus[]
  byType: CaseDistributionByType[]
}

interface MonthlyTrendDataPoint {
  month: string
  monthLabel: string
  casesOpened: number
  casesClosed: number
  collectionAmount: number
}

interface YearlyTrends {
  months: MonthlyTrendDataPoint[]
}

interface ReportsData {
  monthlyCases: MonthlyCaseStats
  monthlyFinance: MonthlyFinanceStats
  caseDistribution: CaseDistribution
  yearlyTrends: YearlyTrends
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function ReportsClient() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/overview')

      if (!response.ok) {
        throw new Error('Rapor verileri yüklenemedi')
      }

      const reportsData = await response.json()
      setData(reportsData)
    } catch (err: any) {
      console.error('Reports fetch error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount)
  }

  const hasData = () => {
    if (!data) return false
    const hasCases = data.monthlyCases.totalActive > 0
    const hasFinance = data.monthlyFinance.invoicedThisMonth > 0 || data.monthlyFinance.collectedThisMonth > 0
    const hasTrends = data.yearlyTrends.months.some((m) => m.casesOpened > 0 || m.casesClosed > 0)
    return hasCases || hasFinance || hasTrends
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Raporlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!data || !hasData()) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz yeterli veri yok</h3>
        <p className="mt-1 text-sm text-gray-500">
          Dosya ve fatura oluşturmaya başlayın, raporlarınız burada görünecek.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Monthly Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bu Ay Özeti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Opened Cases */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Açılan Dosya</p>
                <p className="text-2xl font-bold text-gray-900">{data.monthlyCases.openedThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Closed Cases */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kapanan Dosya</p>
                <p className="text-2xl font-bold text-gray-900">{data.monthlyCases.closedThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Collected This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tahsil Edilen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.monthlyFinance.collectedThisMonth)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Receivables */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bekleyen Alacak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.monthlyFinance.pendingReceivables)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Distribution */}
      {(data.caseDistribution.byStatus.length > 0 || data.caseDistribution.byType.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Dağılımı</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Status */}
            {data.caseDistribution.byStatus.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Duruma Göre</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.caseDistribution.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By Type */}
            {data.caseDistribution.byType.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Dava Türüne Göre</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.caseDistribution.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.caseDistribution.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yearly Trends */}
      {data.yearlyTrends.months.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aylık Trendler (Son 12 Ay)</h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Cases Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Dosya Hareketleri</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.yearlyTrends.months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="casesOpened"
                    stroke="#4F46E5"
                    name="Açılan"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="casesClosed"
                    stroke="#10B981"
                    name="Kapanan"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Collection Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Tahsilat Trendi</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.yearlyTrends.months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="collectionAmount"
                    stroke="#10B981"
                    name="Tahsilat (₺)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

