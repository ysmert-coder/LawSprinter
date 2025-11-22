import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ClientManagementClient from './client-management-client'

export default async function MusteriYonetimiPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
        <p className="mt-1 text-sm text-gray-600">
          Müvekkillerinizin 360° görünümü ve iletişim takibi
        </p>
      </div>

      {/* Main Content */}
      <ClientManagementClient />
    </div>
  )
}

