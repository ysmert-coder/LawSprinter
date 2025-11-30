/**
 * AI Settings Service
 * 
 * Manages BYO (Bring Your Own) API key settings for AI providers
 */

import { createClient } from '@/src/lib/supabaseServer'
import { encryptText, decryptText, validateAPIKeyFormat } from '@/lib/crypto'
import {
  FirmAISettings,
  DecryptedAISettings,
  AIProvider,
  UpdateAISettingsRequest,
} from '@/lib/types/billing'
import { markFirmHasByok } from './billing'

// =====================================================
// QUERIES
// =====================================================

/**
 * Get firm AI settings (encrypted)
 */
export async function getFirmAISettings(firmId: string): Promise<FirmAISettings | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('firm_ai_settings')
      .select('*')
      .eq('firm_id', firmId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found
        return null
      }
      console.error('[getFirmAISettings] Error:', error)
      throw new Error(`Failed to fetch AI settings: ${error.message}`)
    }

    return data as FirmAISettings
  } catch (error: any) {
    console.error('[getFirmAISettings] Exception:', error)
    throw error
  }
}

/**
 * Get firm AI settings with decrypted API key
 */
export async function getDecryptedAISettings(firmId: string): Promise<DecryptedAISettings | null> {
  try {
    const settings = await getFirmAISettings(firmId)

    if (!settings) {
      return null
    }

    // Decrypt API key
    const apiKey = await decryptText(settings.api_key_encrypted)

    return {
      firm_id: settings.firm_id,
      provider: settings.provider,
      model: settings.model,
      api_key: apiKey,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    }
  } catch (error: any) {
    console.error('[getDecryptedAISettings] Exception:', error)
    throw error
  }
}

/**
 * Check if firm has BYO API key configured
 */
export async function hasFirmByok(firmId: string): Promise<boolean> {
  try {
    const settings = await getFirmAISettings(firmId)
    return settings !== null
  } catch (error: any) {
    console.error('[hasFirmByok] Exception:', error)
    return false
  }
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Upsert firm AI settings (create or update)
 */
export async function upsertFirmAISettings(
  firmId: string,
  params: UpdateAISettingsRequest
): Promise<void> {
  try {
    const { provider, model, api_key } = params

    // Validate API key format
    if (!validateAPIKeyFormat(api_key, provider)) {
      throw new Error(`Invalid API key format for provider: ${provider}`)
    }

    // Encrypt API key
    const encryptedKey = await encryptText(api_key)

    const supabase = await createClient()

    // Upsert settings
    const { error } = await supabase.from('firm_ai_settings').upsert(
      {
        firm_id: firmId,
        provider,
        model,
        api_key_encrypted: encryptedKey,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'firm_id',
      }
    )

    if (error) {
      console.error('[upsertFirmAISettings] Error:', error)
      throw new Error(`Failed to save AI settings: ${error.message}`)
    }

    // Mark firm as having BYO key
    await markFirmHasByok(firmId, true)

    console.log(`[upsertFirmAISettings] Updated AI settings for firm ${firmId} (provider: ${provider}, model: ${model})`)
  } catch (error: any) {
    console.error('[upsertFirmAISettings] Exception:', error)
    throw error
  }
}

/**
 * Delete firm AI settings (remove BYO key)
 */
export async function deleteFirmAISettings(firmId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('firm_ai_settings')
      .delete()
      .eq('firm_id', firmId)

    if (error) {
      console.error('[deleteFirmAISettings] Error:', error)
      throw new Error(`Failed to delete AI settings: ${error.message}`)
    }

    // Mark firm as not having BYO key
    await markFirmHasByok(firmId, false)

    console.log(`[deleteFirmAISettings] Deleted AI settings for firm ${firmId}`)
  } catch (error: any) {
    console.error('[deleteFirmAISettings] Exception:', error)
    throw error
  }
}

// =====================================================
// VALIDATION & HELPERS
// =====================================================

/**
 * Test API key by making a simple request
 * (Optional - can be implemented later)
 */
export async function testAPIKey(
  provider: AIProvider,
  model: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement API key testing
  // For now, just validate format
  if (!validateAPIKeyFormat(apiKey, provider)) {
    return {
      success: false,
      error: 'API anahtarı formatı geçersiz',
    }
  }

  return { success: true }
}

/**
 * Get supported models for a provider
 */
export function getSupportedModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'openai':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ]
    case 'openrouter':
      return [
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-opus',
        'google/gemini-pro-1.5',
        'meta-llama/llama-3.1-70b-instruct',
        'deepseek/deepseek-chat',
      ]
    case 'deepseek':
      return ['deepseek-chat', 'deepseek-coder']
    case 'ollama':
      return ['llama3', 'mistral', 'codellama', 'phi3']
    default:
      return []
  }
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'openrouter':
      return 'OpenRouter'
    case 'deepseek':
      return 'DeepSeek'
    case 'ollama':
      return 'Ollama (Local)'
    default:
      return provider
  }
}

/**
 * Get provider documentation URL
 */
export function getProviderDocsURL(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://platform.openai.com/docs/api-reference'
    case 'openrouter':
      return 'https://openrouter.ai/docs'
    case 'deepseek':
      return 'https://platform.deepseek.com/docs'
    case 'ollama':
      return 'https://ollama.ai/docs'
    default:
      return '#'
  }
}

