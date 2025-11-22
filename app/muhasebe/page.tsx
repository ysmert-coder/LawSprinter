import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import AccountingClient from './accounting-client'

export default async function MuhasebePagePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Muhasebe</h1>
        <p className="mt-2 text-gray-600">
          Hukuk bürosu gelir-gider takibi ve fatura yönetimi
        </p>
      </div>

      {/* Client Component */}
      <AccountingClient userId={user.id} />
    </div>
  )
}
