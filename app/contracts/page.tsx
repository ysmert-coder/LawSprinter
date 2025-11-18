import { createClient } from '@/src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ContractsTable from './contracts-table'

export default async function ContractsPage() {
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

  // Get all contracts with related data
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      *,
      cases(id, title, type),
      documents(id, title, storage_path)
    `)
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })

  // Get all active cases for the new contract form
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status')
    .eq('firm_id', firmId)
    .in('status', ['open', 'pending'])
    .order('title', { ascending: true })

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sözleşme Radar</h1>
            <p className="mt-2 text-gray-600">
              Sözleşmelerinizi takip edin ve AI ile analiz edin
            </p>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      {contracts && contracts.length > 0 ? (
        <ContractsTable contracts={contracts} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Takip edilen sözleşme yok</h3>
          <p className="mt-2 text-sm text-gray-500">
            İlk sözleşmenizi ekleyin
          </p>
        </div>
      )}
    </div>
  )
}

