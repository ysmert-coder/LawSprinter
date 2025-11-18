import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ClientsList from './clients-list'
import NewClientModal from './new-client-modal'

export default async function ClientsPage() {
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
    .single<{ firm_id: string }>()

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

  // Get all clients with case counts
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      cases(id, status)
    `)
    .eq('firm_id', firmId)
    .order('full_name', { ascending: true })

  // Transform data to include case counts
  const clientsWithStats = clients?.map((client: any) => ({
    ...client,
    openCasesCount: client.cases?.filter((c: any) => c.status === 'open').length || 0,
    totalCasesCount: client.cases?.length || 0,
  })) || []

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Müşteri Yönetimi</h1>
            <p className="mt-2 text-gray-600">
              Müvekkillerinizi görüntüleyin ve iletişim kurun
            </p>
          </div>
          <NewClientModal firmId={firmId} />
        </div>
      </div>

      {/* Clients List */}
      {clientsWithStats && clientsWithStats.length > 0 ? (
        <ClientsList clients={clientsWithStats} firmId={firmId} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz müvekkil eklenmemiş</h3>
          <p className="mt-2 text-sm text-gray-500">
            İlk müvekkilinizi ekleyin
          </p>
          <div className="mt-6">
            <NewClientModal firmId={firmId} />
          </div>
        </div>
      )}
    </div>
  )
}

