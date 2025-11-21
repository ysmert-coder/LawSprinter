import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in the browser (Client Components)
 * This client will automatically handle the user session
 * @returns Supabase client instance
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing')
    
    // Return a dummy client to prevent crash, but it won't work
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

