import { createClient } from '../../src/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function DavaStratejiPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  const lawAreas = [
    {
      id: 'criminal',
      name: 'Ceza Hukuku',
      icon: '⚖️',
      description: 'Ceza davalarında strateji geliştirin',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'real-estate',
      name: 'Gayrimenkul',
      icon: '🏠',
      description: 'Tapu, kira ve inşaat davaları',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'execution',
      name: 'İcra & İflas',
      icon: '📜',
      description: 'İcra takibi ve iflas süreçleri',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'family',
      name: 'Aile / Boşanma',
      icon: '👨‍👩‍👧‍👦',
      description: 'Boşanma, velayet ve nafaka davaları',
      color: 'from-pink-500 to-pink-600'
    },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dava Strateji Merkezi</h1>
        <p className="mt-2 text-gray-600">
          Farklı hukuk alanları için özel prompt&apos;lu AI brainstorming alanı
        </p>
      </div>

      {/* Law Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {lawAreas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`h-2 bg-gradient-to-r ${area.color}`}></div>
            <div className="p-6">
              <div className="flex items-start">
                <span className="text-4xl mr-4">{area.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                  <button className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                    Strateji Üret
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Strateji Oluştur</h2>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosya Yükle
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Dilekçe, tutanak, bilirkişi raporu vb. yükleyin
            </p>
            <button className="mt-3 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Dosya Seç
            </button>
          </div>
        </div>

        {/* Context Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ek Bilgi / Context
          </label>
          <textarea
            rows={4}
            placeholder="Dava ile ilgili ek bilgiler, özel durumlar..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="ml-2 text-xs text-gray-600">
              <strong>Taslak / Öneri:</strong> AI çıktıları kesin hüküm değildir. 
              Avukat karar vericidir.
            </p>
          </div>
          <button className="ml-4 inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Strateji Üret
          </button>
        </div>
      </div>

      {/* Output Preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Dava Özeti', icon: '📋', color: 'blue' },
          { title: 'Hukuki Sorunlar', icon: '⚠️', color: 'yellow' },
          { title: 'Emsal / Mevzuat', icon: '📚', color: 'green' },
          { title: 'Alternatif Stratejiler', icon: '🎯', color: 'purple' },
        ].map((item) => (
          <div key={item.title} className={`bg-${item.color}-50 rounded-lg p-4 border border-${item.color}-200`}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{item.icon}</span>
              <h3 className={`text-sm font-semibold text-${item.color}-900`}>{item.title}</h3>
            </div>
            <p className={`text-xs text-${item.color}-700`}>
              AI analiz sonuçları burada gösterilecek
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

