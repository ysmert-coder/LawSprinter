/**
 * Subscription Expired Page
 * 
 * Displayed when a user's subscription has expired
 */

import Link from 'next/link'

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Aboneliğinizin Süresi Doldu
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          LawSprinter aboneliğinizin süresi sona erdi. Panele erişim ve AI özelliklerini kullanmaya devam etmek için 
          lütfen aboneliğinizi yenileyin.
        </p>

        {/* Features Lost */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Abonelik yenilenmeden erişemeyeceğiniz özellikler:
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Dava dosyalarına ve müvekkil bilgilerine erişim</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>AI Asistan, Strateji Merkezi, Dilekçe Üretici gibi AI modülleri</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Süre takibi ve hatırlatmalar</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Muhasebe ve tahsilat yönetimi</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Raporlama ve analitik</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <a
            href="mailto:destek@lawsprinter.com?subject=Abonelik Yenileme Talebi"
            className="block w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Aboneliği Yenile
          </a>
          <a
            href="/#pricing"
            className="block w-full px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Planları İncele
          </a>
          <Link
            href="/settings"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ayarlara Git
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sorularınız için:{' '}
            <a href="mailto:destek@lawsprinter.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
              destek@lawsprinter.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

