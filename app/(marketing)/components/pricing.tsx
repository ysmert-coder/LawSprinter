export default function Pricing() {
  const plans = [
    {
      name: 'Solo',
      target: 'Bireysel çalışan avukatlar için ideal',
      price: 'Talep üzerine',
      features: [
        'Tek kullanıcı hesabı',
        'Dava Asistanı (AI)',
        'Süre takibi ve hatırlatmalar',
        'Sözleşme radarı',
        'Müvekkil kartları',
        'Temel raporlama',
        'Ücretsiz AI analiz kredileri',
      ],
      gradient: 'from-blue-500 to-cyan-500',
      popular: false,
    },
    {
      name: 'Büro',
      target: '2-10 kullanıcılı hukuk büroları için',
      price: 'Talep üzerine',
      features: [
        '2-10 kullanıcı',
        'Tüm AI modülleri',
        'Süre & sözleşme radarı',
        'Müvekkil yönetimi & profil analizi',
        'Muhasebe & tahsilat asistanı',
        'Strateji merkezi',
        'Dilekçe üretici & inceleme',
        'Akıllı hukuk bilgi tabanı',
        'Gelişmiş raporlama',
        'Öncelikli destek',
      ],
      gradient: 'from-indigo-600 to-purple-600',
      popular: true,
    },
    {
      name: 'Kurumsal',
      target: '10+ kullanıcı, özel gereksinimler',
      price: 'Özel fiyatlandırma',
      features: [
        'Sınırsız kullanıcı',
        'Tüm modüller',
        'Özel entegrasyonlar',
        'API erişimi',
        'Özel eğitim ve onboarding',
        'Dedicated hesap yöneticisi',
        'SLA garantisi',
        'Özel AI model eğitimi',
        'Çoklu ofis/şube yönetimi',
        '7/24 premium destek',
      ],
      gradient: 'from-purple-600 to-pink-600',
      popular: false,
    },
  ]

  const scrollToContact = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const element = document.querySelector('#contact')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Fiyatlandırma
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Büronuzun büyüklüğüne ve ihtiyaçlarına göre esnek planlar
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Kayıt olduğunuzda ücretsiz AI analiz kredisi dahil
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl border-2 ${
                plan.popular ? 'border-indigo-600 scale-105' : 'border-gray-200'
              } overflow-hidden transition-transform hover:scale-105`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-xl">
                  En Popüler
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4`}>
                  {plan.name[0]}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {plan.target}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  <p className="text-sm text-gray-500">
                    Kullanımınıza göre kredi paketleri
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={scrollToContact}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Teklif Al
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit model explanation */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Kredi Modeli Nasıl Çalışır?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Kayıt olduğunuzda belirli sayıda <strong>ücretsiz AI analiz kredisi</strong> dahildir. 
                Sonrasında kullanımınıza göre kredi paketleri ve/veya aylık planlarla devam edebilirsiniz. 
                Paneli ve modülleri gerçek senaryolarınızda test etmeniz için, başlangıçta sınırlı sayıdaki 
                analizi ücretsiz olarak kullanabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

