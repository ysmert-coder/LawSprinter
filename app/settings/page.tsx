import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<{ firm_id: string; full_name: string; role: string }>()

  // Get firm info
  const { data: firm } = await supabase
    .from('firms')
    .select('*')
    .eq('id', profile?.firm_id)
    .single()

  // Check n8n integration status
  const n8nStatus = {
    contractAnalyze: !!process.env.N8N_CONTRACT_ANALYZE_WEBHOOK_URL,
    hearingFollowup: !!process.env.N8N_HEARING_FOLLOWUP_WEBHOOK_URL,
    clientStatusNotify: !!process.env.N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL,
  }

  const allN8nConfigured = Object.values(n8nStatus).every(Boolean)

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="mt-2 text-gray-600">
          Profil ve sistem ayarlarınızı yönetin
        </p>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Profili</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad
            </label>
            <input
              type="text"
              defaultValue={profile?.full_name || ''}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <input
              type="email"
              defaultValue={user.email || ''}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <input
              type="text"
              defaultValue={profile?.role || 'Avukat'}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Firm Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Büro / Firma Bilgileri</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firma Adı
            </label>
            <input
              type="text"
              defaultValue={firm?.name || ''}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Not:</strong> Firma bilgilerini değiştirmek için sistem yöneticinizle iletişime geçin.
            </p>
          </div>
        </div>
      </div>

      {/* AI Settings Link */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Ayarları
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Kendi OpenAI/OpenRouter API anahtarınızı kullanarak AI maliyetlerini doğrudan kendi hesabınızdan karşılayın.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>• Ücretsiz AI kredileriniz bittiğinde kendi anahtarınızı ekleyebilirsiniz</li>
              <li>• Model kullanım maliyeti doğrudan sizin hesabınıza yansır</li>
              <li>• API anahtarınız şifrelenmiş olarak saklanır</li>
            </ul>
          </div>
          <div className="ml-4">
            <a
              href="/settings/ai"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Yapılandır
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* n8n Integration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">n8n Entegrasyon Durumu</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${allN8nConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">Genel Durum</span>
            </div>
            <span className={`text-sm font-semibold ${allN8nConfigured ? 'text-green-600' : 'text-yellow-600'}`}>
              {allN8nConfigured ? 'AKTİF' : 'KISMEN AKTİF'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${n8nStatus.contractAnalyze ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">Sözleşme Analizi</span>
            </div>
            <span className={`text-xs font-semibold ${n8nStatus.contractAnalyze ? 'text-green-600' : 'text-red-600'}`}>
              {n8nStatus.contractAnalyze ? 'Yapılandırıldı' : 'Eksik'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${n8nStatus.hearingFollowup ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">Duruşma Takibi</span>
            </div>
            <span className={`text-xs font-semibold ${n8nStatus.hearingFollowup ? 'text-green-600' : 'text-red-600'}`}>
              {n8nStatus.hearingFollowup ? 'Yapılandırıldı' : 'Eksik'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${n8nStatus.clientStatusNotify ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">Müvekkil Bildirimleri</span>
            </div>
            <span className={`text-xs font-semibold ${n8nStatus.clientStatusNotify ? 'text-green-600' : 'text-red-600'}`}>
              {n8nStatus.clientStatusNotify ? 'Yapılandırıldı' : 'Eksik'}
            </span>
          </div>

          {!allN8nConfigured && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Eksik Yapılandırma:</strong> n8n webhook URL&apos;lerini `.env.local` dosyasına ekleyin. 
                Detaylı bilgi için dokümantasyona bakın.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Tercihleri</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">E-posta Bildirimleri</p>
              <p className="text-xs text-gray-500 mt-1">Önemli olaylar için e-posta alın</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Süre Hatırlatmaları</p>
              <p className="text-xs text-gray-500 mt-1">Yaklaşan süreler için bildirim</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Not:</strong> Bildirim tercihleri şu anda sadece görüntüleme amaçlıdır. 
              İleride düzenlenebilir hale gelecektir.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Tehlikeli Bölge</h2>
        
        <div className="space-y-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 mb-3">
              Hesabınızı silmek istiyorsanız, tüm verileriniz kalıcı olarak silinecektir. 
              Bu işlem geri alınamaz.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
              Hesabı Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

