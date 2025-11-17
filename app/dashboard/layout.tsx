import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import Sidebar from './sidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
  const companyName = user.user_metadata?.company_name || ''
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          userName={userName}
          userEmail={user.email || ''}
          companyName={companyName}
          userInitials={userInitials}
        />

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex flex-1 justify-between px-4 items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">LawSprinter</span>
              </Link>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userInitials}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
