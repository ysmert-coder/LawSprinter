import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import DeadlinesTable from './deadlines-table'
import NewDeadlineModal from './new-deadline-modal'

export default async function DeadlinesPage() {
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

  // Get all deadlines with related case data
  const { data: deadlines } = await supabase
    .from('deadlines')
    .select(`
      *,
      cases(id, title, type, status)
    `)
    .eq('firm_id', firmId)
    .order('date', { ascending: true })

  // Get all cases for the new deadline form
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status')
    .eq('firm_id', firmId)
    .in('status', ['open', 'pending'])
    .order('title', { ascending: true })

  // Calculate summary stats
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endOfNextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const todayCount = deadlines?.filter(d => d.date === todayStr).length || 0
  const thisWeekCount = deadlines?.filter(d => d.date > todayStr && d.date <= endOfWeek).length || 0
  const nextWeekCount = deadlines?.filter(d => d.date > endOfWeek && d.date <= endOfNextWeek).length || 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Süreler</h1>
            <p className="mt-2 text-gray-600">
              Tüm süreleri görüntüleyin ve takip edin
            </p>
          </div>
          <NewDeadlineModal cases={cases || []} firmId={firmId} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bugün</p>
              <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
              <p className="text-2xl font-bold text-gray-900">{thisWeekCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gelecek Hafta</p>
              <p className="text-2xl font-bold text-gray-900">{nextWeekCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines Table */}
      {deadlines && deadlines.length > 0 ? (
        <DeadlinesTable deadlines={deadlines} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Tanımlı süre bulunmuyor</h3>
          <p className="mt-2 text-sm text-gray-500">
            Dosyalarınıza süre ekleyerek buradan takip edebilirsiniz
          </p>
          <div className="mt-6">
            <NewDeadlineModal cases={cases || []} firmId={firmId} />
          </div>
        </div>
      )}
    </div>
  )
}

