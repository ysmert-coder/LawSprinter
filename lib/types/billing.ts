/**
 * Billing & Subscription Types
 * 
 * Type definitions for the billing, plans, and AI settings system
 */

// =====================================================
// ENUMS
// =====================================================

export type PlanType = 'FREE' | 'SOLO' | 'BURO_5' | 'ENTERPRISE'

export type AIProvider = 'openai' | 'openrouter' | 'ollama' | 'deepseek'

export type AIFeature =
  | 'CASE_ASSISTANT'
  | 'STRATEGY'
  | 'PLEADING_GENERATE'
  | 'PLEADING_REVIEW'
  | 'DRAFT_GENERATOR'
  | 'DRAFT_REVIEWER'
  | 'COLLECTION_ASSISTANT'
  | 'CONTRACT_ANALYZE'
  | 'TRAINING'
  | 'EMBEDDINGS'

// =====================================================
// DATABASE TYPES
// =====================================================

export interface FirmBilling {
  firm_id: string
  plan: PlanType
  max_users: number
  trial_credits_total: number
  trial_credits_used: number
  has_byok: boolean
  subscription_valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FirmAISettings {
  firm_id: string
  provider: AIProvider
  model: string
  api_key_encrypted: string
  created_at: string
  updated_at: string
}

export interface AIUsageLog {
  id: string
  firm_id: string
  user_id: string | null
  feature: AIFeature
  input_tokens: number | null
  output_tokens: number | null
  credits_used: number
  used_trial: boolean
  created_at: string
}

// =====================================================
// SERVICE LAYER TYPES
// =====================================================

/**
 * Decrypted AI settings (for internal use only)
 */
export interface DecryptedAISettings {
  firm_id: string
  provider: AIProvider
  model: string
  api_key: string // Decrypted
  created_at: string
  updated_at: string
}

/**
 * Billing status summary
 */
export interface BillingStatus {
  plan: PlanType
  is_active: boolean
  subscription_valid_until: string | null
  trial_credits_remaining: number
  has_byok: boolean
  can_use_ai: boolean
  reason?: string // If can_use_ai is false, explain why
}

/**
 * Plan configuration
 */
export interface PlanConfig {
  name: PlanType
  display_name: string
  max_users: number
  price_monthly_try: number | null // TRY, null for FREE
  features: string[]
  requires_subscription: boolean
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to update AI settings (BYO key)
 */
export interface UpdateAISettingsRequest {
  provider: AIProvider
  model: string
  api_key: string // Plain text, will be encrypted
}

/**
 * AI usage log entry request
 */
export interface LogAIUsageRequest {
  firm_id: string
  user_id: string
  feature: AIFeature
  input_tokens?: number
  output_tokens?: number
  credits_used: number
  used_trial: boolean
}

/**
 * LLM configuration to send to n8n (when BYO key is used)
 */
export interface LLMConfig {
  provider: AIProvider
  model: string
  api_key: string // Decrypted, sent over HTTPS to n8n
}

// =====================================================
// ERROR TYPES
// =====================================================

export type BillingErrorCode =
  | 'SUBSCRIPTION_EXPIRED'
  | 'TRIAL_CREDITS_EXHAUSTED'
  | 'MAX_USERS_EXCEEDED'
  | 'INVALID_PLAN'
  | 'BYOK_NOT_CONFIGURED'
  | 'BILLING_NOT_FOUND'

export interface BillingError {
  code: BillingErrorCode
  message: string
  details?: any
}

// =====================================================
// PLAN CONFIGURATIONS
// =====================================================

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: 'FREE',
    display_name: 'Ücretsiz Deneme',
    max_users: 1,
    price_monthly_try: null,
    features: [
      '20 ücretsiz AI analizi',
      'Tüm modüller (AI kredisi bitene kadar)',
      '1 kullanıcı',
      'Kendi API anahtarınızı ekleyebilirsiniz',
    ],
    requires_subscription: false,
  },
  SOLO: {
    name: 'SOLO',
    display_name: 'Solo Avukat',
    max_users: 1,
    price_monthly_try: 2000,
    features: [
      'Tüm modüller: Dosyalar, Süreler, Sözleşme Radar',
      'AI Asistan: Dava Asistanı, Strateji Merkezi, Dilekçe Üretici',
      'Müşteri Yönetimi & Muhasebe',
      '1 kullanıcı',
      'Kendi OpenAI/OpenRouter API anahtarınızla çalışır',
      'Model kullanım maliyeti doğrudan hesabınıza yansır',
    ],
    requires_subscription: true,
  },
  BURO_5: {
    name: 'BURO_5',
    display_name: 'Büro (Maks. 5 Kullanıcı)',
    max_users: 5,
    price_monthly_try: 5000,
    features: [
      'Tüm Solo özellikleri',
      'Maksimum 5 kullanıcı',
      'Ortak dosya ve müvekkil havuzu',
      'Ortak raporlama ve analitik',
      'Kendi API anahtarınızla çalışır',
      'Öncelikli destek',
    ],
    requires_subscription: true,
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    display_name: 'Kurumsal',
    max_users: 999,
    price_monthly_try: null, // Custom pricing
    features: [
      'Tüm Büro özellikleri',
      'Sınırsız kullanıcı',
      'Özel entegrasyonlar',
      'Özel eğitim ve onboarding',
      'Dedicated support',
      'SLA garantisi',
    ],
    requires_subscription: true,
  },
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get plan configuration by name
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan]
}

/**
 * Check if a plan requires active subscription
 */
export function requiresSubscription(plan: PlanType): boolean {
  return PLAN_CONFIGS[plan].requires_subscription
}

/**
 * Calculate remaining trial credits
 */
export function calculateRemainingCredits(billing: FirmBilling): number {
  return Math.max(0, billing.trial_credits_total - billing.trial_credits_used)
}

/**
 * Check if subscription is currently active
 */
export function isSubscriptionActive(billing: FirmBilling): boolean {
  // FREE plan is always "active" (limited by credits only)
  if (billing.plan === 'FREE') {
    return true
  }

  // Paid plans require valid subscription date
  if (!billing.is_active) {
    return false
  }

  if (!billing.subscription_valid_until) {
    return false
  }

  const validUntil = new Date(billing.subscription_valid_until)
  const now = new Date()

  return validUntil >= now
}

/**
 * Determine if firm can use AI features
 */
export function canUseAI(billing: FirmBilling): { can: boolean; reason?: string } {
  // If BYO key is configured, AI is always available (user pays directly)
  if (billing.has_byok) {
    return { can: true }
  }

  // For paid plans, check subscription status
  if (requiresSubscription(billing.plan)) {
    if (!isSubscriptionActive(billing)) {
      return {
        can: false,
        reason: 'Aboneliğinizin süresi doldu. Lütfen planınızı yenileyin.',
      }
    }
    // Paid plans with active subscription but no BYO key should have BYO key
    return {
      can: false,
      reason: 'AI özelliklerini kullanmak için kendi API anahtarınızı eklemelisiniz.',
    }
  }

  // FREE plan: check trial credits
  const remaining = calculateRemainingCredits(billing)
  if (remaining <= 0) {
    return {
      can: false,
      reason:
        'Ücretsiz AI kredileriniz tükendi. Abonelik planı seçebilir veya kendi API anahtarınızı ekleyebilirsiniz.',
    }
  }

  return { can: true }
}

