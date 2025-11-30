/**
 * Billing Service
 * 
 * Handles subscription plans, trial credits, and billing operations
 */

import { createClient } from '@/src/lib/supabaseServer'
import {
  FirmBilling,
  PlanType,
  BillingStatus,
  LogAIUsageRequest,
  AIFeature,
  calculateRemainingCredits,
  isSubscriptionActive,
  canUseAI,
  requiresSubscription,
} from '@/lib/types/billing'

// =====================================================
// FIRM & BILLING QUERIES
// =====================================================

/**
 * Get firm for a user
 */
export async function getFirmForUser(userId: string): Promise<{ id: string; name: string } | null> {
  try {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('firm_id, firms(id, name)')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('[getFirmForUser] Error:', error)
      return null
    }

    // @ts-ignore - Supabase nested select
    const firm = profile.firms

    if (!firm) {
      return null
    }

    return {
      id: firm.id,
      name: firm.name,
    }
  } catch (error: any) {
    console.error('[getFirmForUser] Exception:', error)
    return null
  }
}

/**
 * Get firm billing record (creates default if not exists)
 */
export async function getFirmBilling(firmId: string): Promise<FirmBilling> {
  try {
    const supabase = await createClient()

    // Try to get existing billing record
    const { data: billing, error } = await supabase
      .from('firm_billing')
      .select('*')
      .eq('firm_id', firmId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('[getFirmBilling] Error:', error)
      throw new Error(`Failed to fetch billing: ${error.message}`)
    }

    // If billing record exists, return it
    if (billing) {
      return billing as FirmBilling
    }

    // Create default billing record for new firm
    console.log('[getFirmBilling] Creating default billing for firm:', firmId)

    const { data: newBilling, error: insertError } = await supabase
      .from('firm_billing')
      .insert({
        firm_id: firmId,
        plan: 'FREE',
        max_users: 1,
        trial_credits_total: 20,
        trial_credits_used: 0,
        has_byok: false,
        is_active: true,
      })
      .select()
      .single()

    if (insertError || !newBilling) {
      console.error('[getFirmBilling] Insert error:', insertError)
      throw new Error('Failed to create billing record')
    }

    return newBilling as FirmBilling
  } catch (error: any) {
    console.error('[getFirmBilling] Exception:', error)
    throw error
  }
}

/**
 * Get remaining trial credits for a firm
 */
export async function getRemainingTrialCredits(firmId: string): Promise<number> {
  try {
    const billing = await getFirmBilling(firmId)
    return calculateRemainingCredits(billing)
  } catch (error: any) {
    console.error('[getRemainingTrialCredits] Error:', error)
    return 0
  }
}

/**
 * Get billing status summary
 */
export async function getBillingStatus(firmId: string): Promise<BillingStatus> {
  try {
    const billing = await getFirmBilling(firmId)
    const aiCheck = canUseAI(billing)

    return {
      plan: billing.plan,
      is_active: billing.is_active,
      subscription_valid_until: billing.subscription_valid_until,
      trial_credits_remaining: calculateRemainingCredits(billing),
      has_byok: billing.has_byok,
      can_use_ai: aiCheck.can,
      reason: aiCheck.reason,
    }
  } catch (error: any) {
    console.error('[getBillingStatus] Error:', error)
    throw error
  }
}

// =====================================================
// BILLING MUTATIONS
// =====================================================

/**
 * Increment trial credits used
 */
export async function incrementTrialCreditsUsed(
  firmId: string,
  amount: number = 1
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('increment_trial_credits', {
      p_firm_id: firmId,
      p_amount: amount,
    })

    if (error) {
      console.error('[incrementTrialCreditsUsed] Error:', error)
      throw new Error(`Failed to increment credits: ${error.message}`)
    }

    console.log(`[incrementTrialCreditsUsed] Incremented ${amount} credits for firm ${firmId}`)
  } catch (error: any) {
    console.error('[incrementTrialCreditsUsed] Exception:', error)
    throw error
  }
}

/**
 * Set firm plan and subscription details
 */
export async function setFirmPlan(
  firmId: string,
  plan: PlanType,
  maxUsers: number,
  subscriptionValidUntil: Date | null
): Promise<void> {
  try {
    const supabase = await createClient()

    const updateData: any = {
      plan,
      max_users: maxUsers,
      subscription_valid_until: subscriptionValidUntil?.toISOString() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('firm_billing')
      .update(updateData)
      .eq('firm_id', firmId)

    if (error) {
      console.error('[setFirmPlan] Error:', error)
      throw new Error(`Failed to update plan: ${error.message}`)
    }

    console.log(`[setFirmPlan] Updated firm ${firmId} to plan ${plan}`)
  } catch (error: any) {
    console.error('[setFirmPlan] Exception:', error)
    throw error
  }
}

/**
 * Mark firm as having BYO API key
 */
export async function markFirmHasByok(firmId: string, value: boolean): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('firm_billing')
      .update({
        has_byok: value,
        updated_at: new Date().toISOString(),
      })
      .eq('firm_id', firmId)

    if (error) {
      console.error('[markFirmHasByok] Error:', error)
      throw new Error(`Failed to update BYOK status: ${error.message}`)
    }

    console.log(`[markFirmHasByok] Set BYOK=${value} for firm ${firmId}`)
  } catch (error: any) {
    console.error('[markFirmHasByok] Exception:', error)
    throw error
  }
}

/**
 * Deactivate subscription (e.g., when payment fails)
 */
export async function deactivateSubscription(firmId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('firm_billing')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('firm_id', firmId)

    if (error) {
      console.error('[deactivateSubscription] Error:', error)
      throw new Error(`Failed to deactivate subscription: ${error.message}`)
    }

    console.log(`[deactivateSubscription] Deactivated subscription for firm ${firmId}`)
  } catch (error: any) {
    console.error('[deactivateSubscription] Exception:', error)
    throw error
  }
}

// =====================================================
// AI USAGE LOGGING
// =====================================================

/**
 * Log AI feature usage
 */
export async function logAIUsage(params: LogAIUsageRequest): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('ai_usage_log').insert({
      firm_id: params.firm_id,
      user_id: params.user_id,
      feature: params.feature,
      input_tokens: params.input_tokens || null,
      output_tokens: params.output_tokens || null,
      credits_used: params.credits_used,
      used_trial: params.used_trial,
    })

    if (error) {
      console.error('[logAIUsage] Error:', error)
      // Don't throw - logging failure shouldn't break the main flow
      return
    }

    console.log(
      `[logAIUsage] Logged ${params.feature} usage for firm ${params.firm_id} (credits: ${params.credits_used}, trial: ${params.used_trial})`
    )
  } catch (error: any) {
    console.error('[logAIUsage] Exception:', error)
    // Don't throw - logging failure shouldn't break the main flow
  }
}

/**
 * Get AI usage statistics for a firm
 */
export async function getAIUsageStats(
  firmId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_calls: number
  total_credits_used: number
  trial_credits_used: number
  by_feature: Record<AIFeature, number>
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('ai_usage_log')
      .select('feature, credits_used, used_trial')
      .eq('firm_id', firmId)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('[getAIUsageStats] Error:', error)
      throw new Error(`Failed to fetch usage stats: ${error.message}`)
    }

    // Aggregate statistics
    const stats = {
      total_calls: data.length,
      total_credits_used: 0,
      trial_credits_used: 0,
      by_feature: {} as Record<AIFeature, number>,
    }

    for (const log of data) {
      stats.total_credits_used += log.credits_used
      if (log.used_trial) {
        stats.trial_credits_used += log.credits_used
      }

      if (!stats.by_feature[log.feature as AIFeature]) {
        stats.by_feature[log.feature as AIFeature] = 0
      }
      stats.by_feature[log.feature as AIFeature]++
    }

    return stats
  } catch (error: any) {
    console.error('[getAIUsageStats] Exception:', error)
    throw error
  }
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Check if firm can add more users
 */
export async function canAddUser(firmId: string): Promise<{ can: boolean; reason?: string }> {
  try {
    const supabase = await createClient()
    const billing = await getFirmBilling(firmId)

    // Count current users
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)

    if (error) {
      console.error('[canAddUser] Error counting users:', error)
      return { can: false, reason: 'Kullanıcı sayısı kontrol edilemedi' }
    }

    const currentUsers = count || 0

    if (currentUsers >= billing.max_users) {
      return {
        can: false,
        reason: `Planınız maksimum ${billing.max_users} kullanıcıya izin veriyor. Daha fazla kullanıcı eklemek için planınızı yükseltin.`,
      }
    }

    return { can: true }
  } catch (error: any) {
    console.error('[canAddUser] Exception:', error)
    return { can: false, reason: 'Bir hata oluştu' }
  }
}

/**
 * Check if subscription is active (wrapper for type helper)
 */
export function checkSubscriptionActive(billing: FirmBilling): boolean {
  return isSubscriptionActive(billing)
}

