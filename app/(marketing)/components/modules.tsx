export default function Modules() {
  const modules = [
    {
      icon: '🤖',
      title: 'Dava Asistanı (AI)',
      description: 'Dosya yükleyin, yapay zekâ olay özetini, savunma iskeletini ve yapılacaklar listesini otomatik oluştursun.',
      badge: 'AI',
    },
    {
      icon: '🎯',
      title: 'Dava Strateji Merkezi',
      description: 'Hukuki sorularınıza yapay zekâ destekli strateji önerileri alın, risk analizleri yapın.',
      badge: 'AI',
    },
    {
      icon: '⏰',
      title: 'Süre & Sözleşme Radarı',
      description: 'Dava süreleri ve sözleşme yenileme tarihlerini otomatik takip edin, kritik bildirimleri kaçırmayın.',
      badge: null,
    },
    {
      icon: '👥',
      title: 'Müvekkil Yönetimi & Profil',
      description: 'Müvekkil kartları, iletişim geçmişi ve yapay zekâ destekli psikolojik profil analizleri.',
      badge: 'AI',
    },
    {
      icon: '💰',
      title: 'Muhasebe & Tahsilat Asistanı',
      description: 'Fatura yönetimi, taksitli ödeme takibi ve yapay zekâ ile tahsilat mesajı taslakları.',
      badge: 'AI',
    },
    {
      icon: '📚',
      title: 'Akıllı Hukuk Bilgi Tabanı',
      description: 'Mevzuat ve içtihatlar üzerinde akıllı arama yapın, ilgili kaynakları anında bulun.',
      badge: 'AI',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Modüller
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hukuk büronuzun tüm ihtiyaçlarını karşılayan entegre modül sistemi
          </p>
        </div>

        {/* Modules grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon & Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl">{module.icon}</div>
                {module.badge && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full">
                    {module.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {module.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {module.description}
              </p>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

