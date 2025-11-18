import { createClient } from '@/src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import CaseAssistantForm from './case-assistant-form'

export default async function DavaAsistaniPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dava Asistanı (AI)</h1>
        <p className="mt-2 text-gray-600">
          Dosyalarınızı yükleyin, AI savunma iskeletini ve senaryoyu çıkarsın
        </p>
      </div>

      <CaseAssistantForm userId={user.id} />
    </div>
  )
}
