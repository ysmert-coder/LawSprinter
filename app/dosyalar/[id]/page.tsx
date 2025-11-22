import { createClient } from '../../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'
import DraftGeneratorCard from './draft-generator-card'
import DraftReviewerCard from './draft-reviewer-card'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  const caseId = params.id

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

  // Get case details
  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      *,
      clients(id, full_name, email, phone)
    `)
    .eq('id', caseId)
    .eq('firm_id', profile.firm_id)
    .single()

  if (error || !caseData) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Dava bulunamadı veya erişim yetkiniz yok.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
            <p className="mt-2 text-gray-600">
              Dosya No: {caseData.case_number || 'Belirtilmemiş'}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              caseData.status === 'active' ? 'bg-green-100 text-green-800' :
              caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              caseData.status === 'closed' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {caseData.status === 'active' ? 'Aktif' :
               caseData.status === 'pending' ? 'Beklemede' :
               caseData.status === 'closed' ? 'Kapalı' :
               caseData.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Case Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dava Bilgileri</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-600">Dava Türü</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.case_type || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Durum</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseData.status === 'active' ? 'Aktif' :
                   caseData.status === 'pending' ? 'Beklemede' :
                   caseData.status === 'closed' ? 'Kapalı' :
                   caseData.status}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Müvekkil</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseData.clients?.full_name || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Oluşturulma Tarihi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(caseData.created_at).toLocaleDateString('tr-TR')}
                </dd>
              </div>
            </dl>
            {caseData.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-sm font-medium text-gray-600 mb-2">Açıklama</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{caseData.description}</dd>
              </div>
            )}
          </div>

          {/* Draft Generator Card */}
          <DraftGeneratorCard 
            caseId={caseId} 
            caseType={caseData.case_type || 'Genel'}
            userId={user.id}
          />

          {/* Draft Reviewer Card */}
          <DraftReviewerCard 
            caseId={caseId}
            userId={user.id}
          />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Belge Ekle</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Süre Ekle</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Not Ekle</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

