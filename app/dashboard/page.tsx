import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getFirmCriticalDeadlines, getFirmUpcomingDeadlines } from '@/lib/services/deadlines'
import { getFirmPendingClientEvents } from '@/lib/services/caseEvents'
import { getFirmExpiringContracts } from '@/lib/services/contracts'
import { getCaseStatusDistribution, getMonthlyCaseStats } from '@/lib/services/cases'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get user's firm_id from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) {
    // User doesn't have a firm yet - show onboarding
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hoş geldiniz! 👋
          </h1>
          <p className="text-gray-600 mb-8">
            Hesabınız henüz bir firmaya bağlı değil. Lütfen sistem yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    )
  }

  const firmId = profile.firm_id
  const userName = profile.full_name || user.email?.split('@')[0] || 'Kullanıcı'

  // Fetch data using service layer
  const [
    criticalDeadlines,
    upcomingDeadlines,
    pendingClientTasks,
    expiringContracts,
    caseDistribution,
    monthlyStats,
  ] = await Promise.all([
    getFirmCriticalDeadlines(firmId),
    getFirmUpcomingDeadlines(firmId),
    getFirmPendingClientEvents(firmId),
    getFirmExpiringContracts(firmId),
    getCaseStatusDistribution(firmId),
    getMonthlyCaseStats(firmId),
  ])

  // File Distribution for UI
  const fileDistribution = [
    { status: 'Aktif', count: caseDistribution.active, color: 'bg-green-500' },
    { status: 'Beklemede', count: caseDistribution.pending, color: 'bg-yellow-500' },
    { status: 'Kapalı', count: caseDistribution.closed, color: 'bg-gray-500' },
    { status: 'Arşiv', count: caseDistribution.archived, color: 'bg-blue-500' },
  ]

  const totalCases = fileDistribution.reduce((sum, item) => sum + item.count, 0)

  // Calculate percentages
  fileDistribution.forEach(item => {
    item.percentage = totalCases > 0 ? Math.round((item.count / totalCases) * 100) : 0
  })

  // Calculate days remaining for deadlines
  const calculateDaysRemaining = (dateStr: string) => {
    const today = new Date()
    const deadline = new Date(dateStr)
    const diff = deadline.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoş geldiniz, {userName}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          İşte bugünün özeti ve önemli bildirimler
        </p>
      </div>

      {/* Critical Tasks */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Bugünkü Kritik İşler</h2>
              <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {criticalDeadlines?.length || 0} Acil
              </span>
            </div>
          </div>
          {criticalDeadlines && criticalDeadlines.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {criticalDeadlines.map((deadline: any) => {
                const daysLeft = calculateDaysRemaining(deadline.date)
                return (
                  <div key={deadline.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{deadline.description || 'Süre'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Dosya: {deadline.cases?.title || 'Bilinmiyor'} • {daysLeft <= 0 ? 'Gecikmiş' : `${daysLeft} gün kaldı`}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        Kritik
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 mb-4">Bugün için kritik iş bulunmuyor. İlk dosyanız için süre ekleyin.</p>
              <Link
                href="/deadlines"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Süre Ekle
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Yaklaşan Süreler</h2>
              </div>
              <Link href="/deadlines" className="text-sm text-indigo-600 hover:text-indigo-700">
                Tümünü Gör →
              </Link>
            </div>
          </div>
          {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
            <div className="p-6 space-y-4">
              {upcomingDeadlines.map((deadline: any) => {
                const daysLeft = calculateDaysRemaining(deadline.date)
                return (
                  <div key={deadline.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">{daysLeft}g</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{deadline.cases?.title || 'Dosya'}</p>
                      <p className="text-xs text-gray-500 mt-1">{deadline.description} • {deadline.date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Önümüzdeki günler için tanımlı bir süre yok.
            </div>
          )}
        </div>

        {/* Pending from Client */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Müvekkilden Bekleyen İşler</h2>
              </div>
              <Link href="/clients" className="text-sm text-indigo-600 hover:text-indigo-700">
                Tümünü Gör →
              </Link>
            </div>
          </div>
          {pendingClientTasks && pendingClientTasks.length > 0 ? (
            <div className="p-6 space-y-4">
              {pendingClientTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.clients?.full_name || 'Müvekkil'}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.title || task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Müvekkilden bekleyen açık iş yok.
            </div>
          )}
        </div>
      </div>

      {/* Contract Radar */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Sözleşme Radar Özeti</h2>
              </div>
              <Link href="/contracts" className="text-sm text-indigo-600 hover:text-indigo-700">
                Tümünü Gör →
              </Link>
            </div>
          </div>
          {expiringContracts && expiringContracts.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiringContracts.map((contract: any) => {
                  const daysLeft = calculateDaysRemaining(contract.expiry_date)
                  return (
                    <div key={contract.id} className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-start">
                        <span className="text-3xl mr-3">📄</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{contract.cases?.title || 'Sözleşme'}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {daysLeft <= 0 ? 'Süresi dolmuş' : daysLeft <= 30 ? 'Yenileme Yaklaşıyor' : 'Aktif'}
                          </p>
                          <div className="mt-2 flex items-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              daysLeft <= 0 ? 'bg-red-100 text-red-700' :
                              daysLeft <= 30 ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-green-100 text-green-700'
                            }`}>
                              {daysLeft <= 0 ? 'Gecikmiş' : `${daysLeft} gün kaldı`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">Takip edilen sözleşme bulunmuyor. İlk sözleşmenizi ekleyin.</p>
              <Link
                href="/contracts"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sözleşme Ekle
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* File Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dosya Dağılımı</h2>
          </div>
          {totalCases > 0 ? (
            <div className="p-6">
              <div className="space-y-4">
                {fileDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
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
                  <p className="text-3xl font-bold text-gray-900">{totalCases}</p>
                  <p className="text-sm text-gray-500 mt-1">Toplam Dosya</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">Henüz dosya oluşturmadınız.</p>
              <Link
                href="/cases"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                İlk Dosyanızı Ekleyin
              </Link>
            </div>
          )}
        </div>

        {/* Monthly Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Bu Ay Açılan Dosyalar</p>
                <p className="text-4xl font-bold mt-2">{monthlyStats.opened}</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Bu Ay Kapanan Dosyalar</p>
                <p className="text-4xl font-bold mt-2">{monthlyStats.closed}</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
