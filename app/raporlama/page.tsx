import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ReportsClient from './reports-client'

export default async function RaporlamaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="mt-2 text-sm text-gray-600">
          Dosya ve finansal performansınızı takip edin
        </p>
      </div>

      {/* Reports Content */}
      <ReportsClient />
    </div>
  )
}

