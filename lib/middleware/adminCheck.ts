/**
 * Admin Middleware
 * 
 * Checks if the current user is an admin
 */

import { createClient } from '@/src/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?redirectedFrom=/admin')
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'salihmrtpayoneer@gmail.com'

  if (user.email !== adminEmail) {
    console.warn(`[requireAdmin] Unauthorized access attempt by: ${user.email}`)
    redirect('/dashboard')
  }

  return user
}

export async function isAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'salihmrtpayoneer@gmail.com'
  return email === adminEmail
}

