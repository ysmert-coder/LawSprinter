'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Yapay zekâ çıktılarından kim sorumludur?',
      answer: 'AI çıktıları taslak niteliğindedir. Nihai hukuki değerlendirme ve sorumluluk her zaman avukata aittir. LawSprinter, avukatın işini kolaylaştırmak ve hızlandırmak için tasarlanmış bir araçtır; hukuki danışmanlık hizmeti vermez.',
    },
    {
      question: 'Verilerim nerede tutuluyor?',
      answer: 'Verileriniz, güvenli bulut altyapısında, modern şifreleme standartlarıyla korunarak saklanır. Her ofis hesabı altındaki veriler mantıksal ve teknik olarak ayrıdır. Sadece yetkili kullanıcılarınız kendi büronuzun verilerine erişebilir. Erişim kontrolü, satır bazlı güvenlik politikalarıyla (RLS) sıkı şekilde yönetilir.',
    },
    {
      question: 'Müvekkillerimin verileri başka bürolarla karışır mı?',
      answer: 'Kesinlikle hayır. LawSprinter, çok-kullanıcılı (multi-tenant) mimariyle tasarlanmıştır. Her büronun verisi mantıksal ve teknik olarak tamamen ayrıdır. Bir kullanıcı, sadece kendi bürosuna ait dosya ve müvekkil bilgilerine erişebilir. Sistem seviyesinde katı yetkilendirme kuralları uygulanır.',
    },
    {
      question: 'Ücretsiz deneme var mı?',
      answer: 'Zaman bazlı (14 gün, 30 gün gibi) bir ücretsiz deneme yerine, her yeni ofise kayıt sırasında belirli sayıda ücretsiz AI analiz kredisi verilir. Bu sayede paneli ve modülleri gerçek senaryolarınızda test edebilir, AI çıktılarının kalitesini değerlendirebilirsiniz. Kredileriniz bittiğinde, kullanımınıza göre kredi paketleri veya aylık planlardan birini seçerek devam edebilirsiniz.',
    },
    {
      question: 'Her ekip üyesi için ayrı hesap mı açmam gerekiyor?',
      answer: 'Hayır. LawSprinter\'da ofis bazlı bir hesap yapısı vardır. Büro sahibi veya yönetici, ekip üyelerini davet eder ve her kullanıcıya rol bazlı yetkiler verir (örneğin avukat, stajyer, sekreter). Böylece herkes kendi yetkisi dahilinde dosyalara ve modüllere erişir.',
    },
    {
      question: 'Birden fazla ofisim/şubem varsa nasıl yönetilir?',
      answer: 'Kurumsal planda, çoklu ofis/şube yönetimi desteği sunulmaktadır. Her şube için ayrı hesaplar oluşturabilir veya merkezi bir yönetim panelinden tüm şubelerinizi yönetebilirsiniz. Detaylar için bizimle iletişime geçin.',
    },
  ]

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sıkça Sorulan Sorular
          </h2>
          <p className="text-lg text-gray-600">
            Merak ettiklerinizin cevapları burada
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 text-indigo-600 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Başka sorularınız mı var?
          </p>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault()
              const element = document.querySelector('#contact')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Bizimle iletişime geçin
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

