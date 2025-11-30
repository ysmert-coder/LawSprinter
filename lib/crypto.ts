/**
 * Cryptography Helpers
 * 
 * Encryption/decryption utilities for sensitive data (API keys)
 * Uses Supabase pgcrypto extension (pgp_sym_encrypt/decrypt)
 */

import { createClient } from '@/src/lib/supabaseServer'

/**
 * Get encryption key from environment
 * This key is used by Postgres pgcrypto functions
 */
function getEncryptionKey(): string {
  const key = process.env.PG_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error(
      'PG_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY must be set for encryption'
    )
  }

  return key
}

/**
 * Encrypt a plain text string using Postgres pgcrypto
 * 
 * @param plainText - The text to encrypt (e.g., API key)
 * @returns Encrypted text (base64 encoded)
 */
export async function encryptText(plainText: string): Promise<string> {
  if (!plainText || plainText.trim() === '') {
    throw new Error('Cannot encrypt empty text')
  }

  const supabase = await createClient()
  const encryptionKey = getEncryptionKey()

  // Use Postgres pgcrypto to encrypt
  // pgp_sym_encrypt returns bytea, we encode it to base64 for storage
  const { data, error } = await supabase.rpc('encrypt_text', {
    plain_text: plainText,
    encryption_key: encryptionKey,
  })

  if (error) {
    console.error('[encryptText] Error:', error)
    throw new Error(`Failed to encrypt text: ${error.message}`)
  }

  if (!data) {
    throw new Error('Encryption returned no data')
  }

  return data as string
}

/**
 * Decrypt an encrypted string using Postgres pgcrypto
 * 
 * @param encryptedText - The encrypted text (base64 encoded)
 * @returns Decrypted plain text
 */
export async function decryptText(encryptedText: string): Promise<string> {
  if (!encryptedText || encryptedText.trim() === '') {
    throw new Error('Cannot decrypt empty text')
  }

  const supabase = await createClient()
  const encryptionKey = getEncryptionKey()

  // Use Postgres pgcrypto to decrypt
  const { data, error } = await supabase.rpc('decrypt_text', {
    encrypted_text: encryptedText,
    encryption_key: encryptionKey,
  })

  if (error) {
    console.error('[decryptText] Error:', error)
    throw new Error(`Failed to decrypt text: ${error.message}`)
  }

  if (!data) {
    throw new Error('Decryption returned no data')
  }

  return data as string
}

/**
 * Validate API key format (basic check)
 * 
 * @param apiKey - API key to validate
 * @param provider - AI provider name
 * @returns True if format looks valid
 */
export function validateAPIKeyFormat(apiKey: string, provider: string): boolean {
  if (!apiKey || apiKey.trim() === '') {
    return false
  }

  const trimmed = apiKey.trim()

  switch (provider.toLowerCase()) {
    case 'openai':
      // OpenAI keys start with 'sk-'
      return trimmed.startsWith('sk-') && trimmed.length > 20
    
    case 'openrouter':
      // OpenRouter keys start with 'sk-or-'
      return trimmed.startsWith('sk-or-') && trimmed.length > 30
    
    case 'deepseek':
      // DeepSeek keys format (adjust if needed)
      return trimmed.length > 20
    
    case 'ollama':
      // Ollama is local, no key needed (but we store a dummy value)
      return true
    
    default:
      // Generic validation: at least 20 characters
      return trimmed.length >= 20
  }
}

/**
 * Mask API key for display (show only first 8 and last 4 characters)
 * 
 * @param apiKey - API key to mask
 * @returns Masked API key (e.g., "sk-proj-...abc123")
 */
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return '***'
  }

  const start = apiKey.substring(0, 8)
  const end = apiKey.substring(apiKey.length - 4)

  return `${start}...${end}`
}

