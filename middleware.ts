import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes - require authentication
  const protectedRoutes = [
    '/dashboard',
    '/cases',
    '/deadlines',
    '/contracts',
    '/clients',
    '/dava-asistani',
    '/dava-strateji',
    '/muhasebe',
    '/reports',
    '/settings'
  ]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes - redirect to dashboard if already logged in
  const authRoutes = ['/auth/sign-in', '/auth/sign-up', '/login', '/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access auth routes
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Check subscription status for protected routes (except settings and subscription expired page)
  if (user && isProtectedRoute && !pathname.startsWith('/settings') && pathname !== '/abonelik-bitti') {
    try {
      // Get user's firm_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single()

      if (profile?.firm_id) {
        // Get firm billing
        const { data: billing } = await supabase
          .from('firm_billing')
          .select('plan, subscription_valid_until, is_active')
          .eq('firm_id', profile.firm_id)
          .single()

        // Check if subscription is expired for paid plans
        if (billing && billing.plan !== 'FREE') {
          const isActive = billing.is_active
          const validUntil = billing.subscription_valid_until ? new Date(billing.subscription_valid_until) : null
          const now = new Date()

          if (!isActive || (validUntil && validUntil < now)) {
            // Subscription expired - redirect to subscription expired page
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/abonelik-bitti'
            return NextResponse.redirect(redirectUrl)
          }
        }
      }
    } catch (error) {
      console.error('[Middleware] Error checking subscription:', error)
      // Don't block access if there's an error checking subscription
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

