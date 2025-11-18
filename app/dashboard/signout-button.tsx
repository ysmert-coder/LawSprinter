'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../supabase'

export function useSignOut() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
    router.refresh()
  }

  return handleSignOut
}

