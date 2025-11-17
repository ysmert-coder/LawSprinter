import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get user's firm_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">Hesabınız henüz bir firmaya bağlı değil.</p>
        </div>
      </div>
    )
  }

  const firmId = profile.firm_id

  // Get current month data
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()

  // Cases metrics
  const { data: casesThisMonth } = await supabase
    .from('cases')
    .select('id, status, created_at')
    .eq('firm_id', firmId)
    .gte('created_at', firstDayOfMonth)

  const { data: casesClosedThisMonth } = await supabase
    .from('cases')
    .select('id')
    .eq('firm_id', firmId)
    .eq('status', 'closed')
    .gte('updated_at', firstDayOfMonth)

  const { data: allCases } = await supabase
    .from('cases')
    .select('status')
    .eq('firm_id', firmId)

  // Financial metrics
  const { data: finances } = await supabase
    .from('case_finances')
    .select('amount, status, type, created_at')
    .eq('firm_id', firmId)
    .gte('created_at', firstDayOfMonth)

  const totalCollected = finances?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0
  const totalPending = finances?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0

  // Calculate case distribution
  const casesByStatus = {
    open: allCases?.filter(c => c.status === 'open').length || 0,
    pending: allCases?.filter(c => c.status === 'pending').length || 0,
    closed: allCases?.filter(c => c.status === 'closed').length || 0,
    archived: allCases?.filter(c => c.status === 'archived').length || 0,
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Raporlama</h1>
        <p className="mt-2 text-gray-600">
          Dosya ve finansal metriklerinizi görüntüleyin
        </p>
      </div>

      {/* Monthly Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bu Ay Özeti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Açılan Dosya</p>
                <p className="text-2xl font-bold text-gray-900">{casesThisMonth?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kapanan Dosya</p>
                <p className="text-2xl font-bold text-gray-900">{casesClosedThisMonth?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tahsil Edilen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(totalCollected)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bekleyen Alacak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(totalPending)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Distribution */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Dağılımı</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {[
              { label: 'Aktif', count: casesByStatus.open, color: 'bg-green-500', percentage: (casesByStatus.open / (allCases?.length || 1)) * 100 },
              { label: 'Beklemede', count: casesByStatus.pending, color: 'bg-yellow-500', percentage: (casesByStatus.pending / (allCases?.length || 1)) * 100 },
              { label: 'Kapalı', count: casesByStatus.closed, color: 'bg-gray-500', percentage: (casesByStatus.closed / (allCases?.length || 1)) * 100 },
              { label: 'Arşiv', count: casesByStatus.archived, color: 'bg-blue-500', percentage: (casesByStatus.archived / (allCases?.length || 1)) * 100 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{allCases?.length || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Toplam Dosya</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rapor Dışa Aktar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">PDF İndir</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Excel İndir</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">E-posta Gönder</span>
          </button>
        </div>
      </div>
    </div>
  )
}

