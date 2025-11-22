export default function Security() {
  const securityPoints = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      text: 'Verileriniz, modern standartlara uygun şekilde şifrelenmiş ve yalnızca yetkili kullanıcılarınızın erişebildiği güvenli bir bulut altyapısında tutulur.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      text: 'Her hukuk bürosu, sadece kendi verisini görecek şekilde çok-kullanıcılı (multi-tenant) ve satır bazlı yetkilendirme mantığıyla tasarlanmıştır.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      text: 'Yapay zekâ işlemleri, kontrollü ve sınırları belirlenmiş bir altyapı üzerinde çalışır; müvekkil verileriniz üçüncü taraflarla paylaşılmadan analiz edilebilir.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      text: 'AI çıktıları taslak niteliğindedir; nihai hukuki değerlendirme ve sorumluluk her zaman avukata aittir.',
    },
  ]

  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Veri güvenliği, tasarımın merkezinde
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Müvekkil verilerinizin güvenliği ve gizliliği, LawSprinter'ın temel tasarım prensiplerinden biridir.
            </p>

            {/* Security points */}
            <div className="space-y-6">
              {securityPoints.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-md">
                    {point.icon}
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-2">
                    {point.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              {/* Security badges */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="text-sm font-semibold text-green-900">Şifreli Veri</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <div className="text-sm font-semibold text-blue-900">RLS Koruması</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                  <div className="text-3xl mb-2">👤</div>
                  <div className="text-sm font-semibold text-purple-900">Rol Bazlı Erişim</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <div className="text-sm font-semibold text-orange-900">2FA Desteği</div>
                </div>
              </div>

              {/* Compliance badges */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 text-center mb-4">Güvenlik Standartları</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    KVKK Uyumlu
                  </div>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    GDPR Ready
                  </div>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    ISO 27001
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50 -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}

