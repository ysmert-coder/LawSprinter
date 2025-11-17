import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Create a Supabase client for use in the browser (Client Components)
 * This client will automatically handle the user session
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Render Dashboard'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

