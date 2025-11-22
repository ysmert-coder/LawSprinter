export default function About() {
  const highlights = [
    {
      icon: '🤝',
      title: 'Hukuk bürolarıyla birlikte tasarlandı',
      description: 'Farklı bürolardan alınan geri bildirimlerle ekranlar ve iş akışları şekillendi.',
    },
    {
      icon: '⚡',
      title: 'Ürün & yazılım odaklı ekip',
      description: 'Modern SaaS ve yapay zekâ teknolojileri üzerine çalışan deneyimli geliştirme ekibi.',
    },
    {
      icon: '🎯',
      title: 'Gerçek kullanım senaryolarıyla beslenen modüller',
      description: 'Dava, icra, sözleşme ve müvekkil yönetimi süreçlerinden öğrenen akıllı otomasyonlar.',
    },
  ]

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Biz Kimiz?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-8" />
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              <strong className="text-gray-900">LawSprinter</strong>, hukuk büroları ve in-house hukuk ekipleri için geliştirilmiş, 
              hukuk odaklı bir operasyon ve otomasyon platformudur.
            </p>
            
            <p>
              Ürün, profesyonel bir yazılım ekibi ile farklı şehirlerdeki (İstanbul, Ankara, İzmir gibi) birden çok hukuk bürosu 
              ve hukukçu danışmanın birlikte çalışmasıyla şekillenmiştir. Uzun süren görüşmeler, atölye çalışmaları ve pilot 
              uygulamalar sonucunda, gerçek dosya ve iş akışları üzerinden defalarca iterasyon yapılmıştır.
            </p>
            
            <p>
              LawSprinter'daki akıllı modüller, rastgele genel amaçlı bir sistem olarak değil; <strong className="text-indigo-600">dava, 
              icra, ticaret, aile ve uyum</strong> gibi alanlarda çalışan büroların günlük pratiklerinden alınan senaryolarla 
              tasarlanmıştır.
            </p>
            
            <p className="text-xl font-semibold text-gray-900 border-l-4 border-indigo-600 pl-6 py-2 bg-indigo-50">
              Amaç, avukatın yerini almak değil, onun zamanını geri verip daha stratejik işlere odaklanmasını sağlamaktır.
            </p>
          </div>
        </div>

        {/* Highlights grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-6xl mb-4">{highlight.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {highlight.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">10+</div>
            <div className="text-sm text-gray-600">Pilot Büro</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
            <div className="text-sm text-gray-600">Atölye Çalışması</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-600 mb-2">1000+</div>
            <div className="text-sm text-gray-600">Test Senaryosu</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Destek</div>
          </div>
        </div>
      </div>
    </section>
  )
}

