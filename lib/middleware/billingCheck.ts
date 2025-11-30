/**
 * Billing Check Middleware
 * 
 * Reusable billing and credit check logic for AI API routes
 */

import { NextResponse } from 'next/server'
import {
  getFirmForUser,
  getFirmBilling,
  getRemainingTrialCredits,
  incrementTrialCreditsUsed,
  logAIUsage,
  checkSubscriptionActive,
} from '../services/billing'
import { getDecryptedAISettings, hasFirmByok } from '../services/aiSettings'
import { LLMConfig, AIFeature } from '../types/billing'

export interface BillingCheckResult {
  success: boolean
  firm_id?: string
  has_byok?: boolean
  llm_config?: LLMConfig
  error_response?: NextResponse
}

/**
 * Check billing status and return LLM config if BYO key is used
 * Returns error response if checks fail
 */
export async function checkBillingForAI(userId: string): Promise<BillingCheckResult> {
  // Get firm
  const firm = await getFirmForUser(userId)
  if (!firm) {
    return {
      success: false,
      error_response: NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 }),
    }
  }

  // Get billing
  const billing = await getFirmBilling(firm.id)

  // Check subscription status
  if (!checkSubscriptionActive(billing)) {
    return {
      success: false,
      error_response: NextResponse.json(
        {
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Aboneliğinizin süresi doldu. Lütfen planınızı yenileyin.',
        },
        { status: 402 }
      ),
    }
  }

  // Check BYO key or trial credits
  const hasByok = await hasFirmByok(firm.id)
  let llmConfig: LLMConfig | undefined

  if (hasByok) {
    // User has BYO key
    const aiSettings = await getDecryptedAISettings(firm.id)

    if (!aiSettings) {
      return {
        success: false,
        error_response: NextResponse.json(
          {
            error: 'BYOK_NOT_CONFIGURED',
            message: 'API anahtarı yapılandırması bulunamadı',
          },
          { status: 500 }
        ),
      }
    }

    llmConfig = {
      provider: aiSettings.provider,
      model: aiSettings.model,
      api_key: aiSettings.api_key,
    }
  } else {
    // Check trial credits
    const remaining = await getRemainingTrialCredits(firm.id)

    if (remaining <= 0) {
      return {
        success: false,
        error_response: NextResponse.json(
          {
            error: 'TRIAL_CREDITS_EXHAUSTED',
            message:
              'Ücretsiz AI kredileriniz tükendi. AI modüllerini kullanmaya devam etmek için abonelik planı seçebilir veya kendi API anahtarınızı ekleyebilirsiniz.',
          },
          { status: 402 }
        ),
      }
    }
  }

  return {
    success: true,
    firm_id: firm.id,
    has_byok: hasByok,
    llm_config: llmConfig,
  }
}

/**
 * Log AI usage after successful call
 */
export async function logAICall(
  firmId: string,
  userId: string,
  feature: AIFeature,
  hasByok: boolean
): Promise<void> {
  if (!hasByok) {
    // Using trial credits - decrement
    await incrementTrialCreditsUsed(firmId, 1)
    await logAIUsage({
      firm_id: firmId,
      user_id: userId,
      feature,
      credits_used: 1,
      used_trial: true,
    })
  } else {
    // Using BYO key - no credit deduction
    await logAIUsage({
      firm_id: firmId,
      user_id: userId,
      feature,
      credits_used: 0,
      used_trial: false,
    })
  }
}

