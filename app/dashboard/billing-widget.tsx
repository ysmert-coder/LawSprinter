'use client'

/**
 * Billing Widget
 * 
 * Displays subscription status, trial credits, and BYO key status
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../supabase'
import { BillingStatus } from '../../lib/types/billing'

export default function BillingWidget() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillingStatus()
  }, [])

  async function loadBillingStatus() {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch billing status from API
      const response = await fetch('/api/billing/status')

      if (!response.ok) {
        throw new Error('Failed to fetch billing status')
      }

      const data: BillingStatus = await response.json()
      setBilling(data)
    } catch (err: any) {
      console.error('[BillingWidget] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error || !billing) {
    return null // Don't show widget if there's an error
  }

  // Determine widget color and message
  const getStatusColor = () => {
    if (!billing.can_use_ai) return 'red'
    if (billing.has_byok) return 'green'
    if (billing.trial_credits_remaining <= 5) return 'yellow'
    return 'blue'
  }

  const statusColor = getStatusColor()

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-800',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const colors = colorClasses[statusColor]

  return (
    <div className={`rounded-xl shadow-sm border ${colors.border} ${colors.bg} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${colors.text}`}>
          {billing.has_byok ? '🔑 AI: Kendi Anahtarınız' : '🎁 AI Kredileri'}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
          {billing.plan === 'FREE' && 'Ücretsiz'}
          {billing.plan === 'SOLO' && 'Solo'}
          {billing.plan === 'BURO_5' && 'Büro'}
          {billing.plan === 'ENTERPRISE' && 'Kurumsal'}
        </span>
      </div>

      {/* BYO Key Active */}
      {billing.has_byok && (
        <div className="space-y-3">
          <p className="text-sm text-green-800">
            ✓ AI özellikleri kendi API anahtarınızla aktif
          </p>
          <p className="text-xs text-green-700">
            Model kullanım maliyeti doğrudan sizin hesabınıza yansıyor.
          </p>
          <Link
            href="/settings/ai"
            className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-900"
          >
            Ayarları Yönet
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Trial Credits */}
      {!billing.has_byok && billing.can_use_ai && (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {billing.trial_credits_remaining}
              </p>
              <p className="text-sm text-gray-600">kalan ücretsiz AI kredisi</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">20 krediden</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                billing.trial_credits_remaining <= 5 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${(billing.trial_credits_remaining / 20) * 100}%`,
              }}
            ></div>
          </div>

          {billing.trial_credits_remaining <= 5 && (
            <div className="pt-2">
              <p className="text-xs text-yellow-800 mb-2">
                ⚠️ Kredileriniz azalıyor! Devam etmek için:
              </p>
              <div className="flex gap-2">
                <Link
                  href="/settings/ai"
                  className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                >
                  Kendi API Anahtarımı Ekle
                </Link>
                <a
                  href="#pricing"
                  className="flex-1 text-center px-3 py-2 bg-white text-indigo-600 border border-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-50"
                >
                  Planları Gör
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credits Exhausted */}
      {!billing.has_byok && !billing.can_use_ai && (
        <div className="space-y-3">
          <div className="flex items-center text-red-800 mb-2">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-semibold">AI Kredileri Tükendi</span>
          </div>
          <p className="text-sm text-red-700 mb-3">{billing.reason}</p>
          <div className="space-y-2">
            <Link
              href="/settings/ai"
              className="block w-full text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Kendi API Anahtarımı Ekle
            </Link>
            <a
              href="#pricing"
              className="block w-full text-center px-4 py-2 bg-white text-indigo-600 border border-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50"
            >
              Abonelik Planlarını Gör
            </a>
          </div>
        </div>
      )}

      {/* Subscription Expired */}
      {!billing.is_active && billing.plan !== 'FREE' && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center text-red-800 mb-2">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-semibold">Abonelik Süresi Doldu</span>
          </div>
          <p className="text-xs text-red-700 mb-2">
            {billing.subscription_valid_until &&
              `Son geçerlilik: ${new Date(billing.subscription_valid_until).toLocaleDateString('tr-TR')}`}
          </p>
          <a
            href="mailto:destek@lawsprinter.com"
            className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
          >
            Aboneliği Yenile
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}

