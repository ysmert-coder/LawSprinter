'use client'

/**
 * AI Settings Page
 * 
 * Allows users to configure BYO (Bring Your Own) API keys for AI providers
 * When configured, AI costs are charged directly to the user's account
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../supabase'
import {
  AIProvider,
  UpdateAISettingsRequest,
  DecryptedAISettings,
} from '../../../lib/types/billing'

const PROVIDERS: AIProvider[] = ['openai', 'openrouter', 'deepseek', 'ollama']

// Client-side helper functions
function getSupportedModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    case 'openrouter':
      return [
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'deepseek/deepseek-chat',
        'google/gemini-pro-1.5',
      ]
    case 'deepseek':
      return ['deepseek-chat', 'deepseek-coder']
    case 'ollama':
      return [] // User enters custom model name
    default:
      return []
  }
}

function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'openrouter':
      return 'OpenRouter'
    case 'deepseek':
      return 'DeepSeek'
    case 'ollama':
      return 'Ollama (Self-hosted)'
    default:
      return provider
  }
}

function getProviderDocsURL(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://platform.openai.com/docs/api-reference'
    case 'openrouter':
      return 'https://openrouter.ai/docs'
    case 'deepseek':
      return 'https://platform.deepseek.com/api-docs'
    case 'ollama':
      return 'https://ollama.ai/library'
    default:
      return '#'
  }
}

export default function AISettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Existing settings
  const [hasExistingSettings, setHasExistingSettings] = useState(false)
  const [existingProvider, setExistingProvider] = useState<AIProvider | null>(null)
  const [existingModel, setExistingModel] = useState<string | null>(null)

  useEffect(() => {
    loadExistingSettings()
  }, [])

  async function loadExistingSettings() {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/sign-in')
        return
      }

      // Get existing settings (without decrypted key)
      const response = await fetch('/api/settings/ai')

      if (response.ok) {
        const data = await response.json()
        if (data.provider && data.model) {
          setHasExistingSettings(true)
          setExistingProvider(data.provider)
          setExistingModel(data.model)
          setProvider(data.provider)
          setModel(data.model)
        }
      }
    } catch (err: any) {
      console.error('[AISettings] Load error:', err)
      setError('Ayarlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validate
      if (!provider) {
        setError('Lütfen bir AI sağlayıcı seçin')
        return
      }

      if (!model || !model.trim()) {
        setError('Lütfen bir model adı girin')
        return
      }

      if (!apiKey || !apiKey.trim()) {
        setError('Lütfen API anahtarınızı girin')
        return
      }

      const requestBody: UpdateAISettingsRequest = {
        provider,
        model: model.trim(),
        api_key: apiKey.trim(),
      }

      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ayarlar kaydedilemedi')
      }

      setSuccess('AI ayarları başarıyla kaydedildi! Artık AI özelliklerini kendi API anahtarınızla kullanabilirsiniz.')
      setHasExistingSettings(true)
      setExistingProvider(provider)
      setExistingModel(model)
      setApiKey('') // Clear API key field after save
      setShowApiKey(false)

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error('[AISettings] Save error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('AI ayarlarınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/settings/ai', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ayarlar silinemedi')
      }

      setSuccess('AI ayarları silindi. Artık ücretsiz AI kredilerinizi kullanacaksınız.')
      setHasExistingSettings(false)
      setExistingProvider(null)
      setExistingModel(null)
      setProvider('openai')
      setModel('')
      setApiKey('')

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error('[AISettings] Delete error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const supportedModels = getSupportedModels(provider)

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Ayarları</h1>
        <p className="mt-2 text-gray-600">
          Kendi OpenAI/OpenRouter API anahtarınızı kullanarak AI maliyetlerini doğrudan kendi hesabınızdan karşılayın.
        </p>
      </div>

      {/* Info Card */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg
            className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">BYO (Bring Your Own) API Key Nasıl Çalışır?</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>API anahtarınız şifrelenmiş olarak saklanır ve sadece sizin istekleriniz için kullanılır</li>
              <li>Model kullanım maliyeti doğrudan OpenAI/OpenRouter hesabınıza yansır</li>
              <li>LawSprinter bu maliyete karışmaz, sadece platform ücreti alır</li>
              <li>Ücretsiz AI kredileriniz devre dışı kalır (gerekirse tekrar aktif edebilirsiniz)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Settings */}
      {hasExistingSettings && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-900 mb-1">✓ API Anahtarı Yapılandırılmış</h3>
              <p className="text-sm text-green-800">
                Sağlayıcı: <span className="font-medium">{getProviderDisplayName(existingProvider!)}</span> | Model:{' '}
                <span className="font-medium">{existingModel}</span>
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Sil
            </button>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">AI Sağlayıcı</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as AIProvider)
              setModel('') // Reset model when provider changes
            }}
            disabled={saving}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {getProviderDisplayName(p)}
              </option>
            ))}
          </select>
          <a
            href={getProviderDocsURL(provider)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            {getProviderDisplayName(provider)} Dokümantasyonu
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          {supportedModels.length > 0 ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Model seçin...</option>
              {supportedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Örn: gpt-4o, gpt-4o-mini"
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          )}
          <p className="mt-1 text-xs text-gray-500">
            {provider === 'openai' && 'Önerilen: gpt-4o-mini (hızlı ve ekonomik)'}
            {provider === 'openrouter' && 'Önerilen: openai/gpt-4o-mini veya deepseek/deepseek-chat'}
            {provider === 'deepseek' && 'Önerilen: deepseek-chat'}
            {provider === 'ollama' && 'Yerel model adı (örn: llama3, mistral)'}
          </p>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Anahtarı</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasExistingSettings ? 'Değiştirmek için yeni anahtar girin...' : 'sk-...'}
              disabled={saving}
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            API anahtarınız şifrelenmiş olarak saklanır ve asla üçüncü taraflarla paylaşılmaz
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/settings')}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !provider || !model || !apiKey}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Kaydediliyor...' : hasExistingSettings ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        🔒 API anahtarınız AES-256 şifreleme ile korunur ve sadece sizin istekleriniz için kullanılır
      </div>
    </div>
  )
}

