import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LawSprinter - Hukuk Büroları için Yapay Zekâ Destekli Operasyon Paneli',
  description: 'Dava dosyalarınızı, sürelerinizi, müvekkil iletişimini ve yapay zekâ destekli analizleri tek panelden yönetin.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

