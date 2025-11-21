import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import StrategyForm from './strategy-form'

export default async function DavaStratejiPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Dava Strateji Merkezi</h1>
        <p className="mt-2 text-gray-600">
          Farklı hukuk alanları için özel prompt&apos;lu AI brainstorming alanı
        </p>
      </div>

      <StrategyForm userId={user.id} />
    </div>
  )
}

