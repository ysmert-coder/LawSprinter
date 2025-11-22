/**
 * n8n Webhook Integration
 * 
 * Helper functions to trigger n8n workflows via webhooks
 * All webhooks are configured via environment variables
 * 
 * IMPORTANT: All AI processing happens in n8n workflows, not in Next.js code.
 * This keeps the application free from direct AI provider dependencies.
 */

/**
 * Available n8n webhook types
 */
export type N8NWebhookType = 
  | 'CASE_ASSISTANT'
  | 'STRATEGY'
  | 'CLIENT_PROFILE'
  | 'TRAINING'
  | 'INVOICE_REMINDER'
  | 'CONTRACT_ANALYZE'
  | 'HEARING_FOLLOWUP'
  | 'CLIENT_STATUS_NOTIFY'
  | 'DRAFT_GENERATOR'
  | 'COLLECTION_ASSISTANT'
  | 'DRAFT_REVIEWER'
  | 'EMBEDDINGS'
  | 'PLEADING_GENERATOR'
  | 'PLEADING_REVIEW'

/**
 * Get the webhook URL for a specific type
 */
function getWebhookUrl(type: N8NWebhookType): string {
  const urls: Record<N8NWebhookType, string | undefined> = {
    CASE_ASSISTANT: process.env.N8N_CASE_ASSISTANT_WEBHOOK_URL,
    STRATEGY: process.env.N8N_STRATEGY_WEBHOOK_URL,
    CLIENT_PROFILE: process.env.N8N_CLIENT_PROFILE_WEBHOOK_URL,
    TRAINING: process.env.N8N_TRAINING_WEBHOOK_URL,
    INVOICE_REMINDER: process.env.N8N_INVOICE_REMINDER_WEBHOOK_URL,
    CONTRACT_ANALYZE: process.env.N8N_CONTRACT_ANALYZE_WEBHOOK_URL,
    HEARING_FOLLOWUP: process.env.N8N_HEARING_FOLLOWUP_WEBHOOK_URL,
    CLIENT_STATUS_NOTIFY: process.env.N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL,
    DRAFT_GENERATOR: process.env.N8N_DRAFT_GENERATOR_WEBHOOK_URL,
    COLLECTION_ASSISTANT: process.env.N8N_COLLECTION_ASSISTANT_WEBHOOK_URL,
    DRAFT_REVIEWER: process.env.N8N_DRAFT_REVIEWER_WEBHOOK_URL,
    EMBEDDINGS: process.env.N8N_EMBEDDINGS_WEBHOOK_URL,
    PLEADING_GENERATOR: process.env.N8N_PLEADING_GENERATOR_WEBHOOK_URL,
    PLEADING_REVIEW: process.env.N8N_PLEADING_REVIEW_WEBHOOK_URL,
  }

  const url = urls[type]
  if (!url) {
    throw new Error(
      `n8n webhook URL for ${type} is not configured. ` +
      `Please add N8N_${type}_WEBHOOK_URL to your .env.local file.`
    )
  }

  return url
}

/**
 * Generic function to call an n8n webhook by type.
 * @param type The webhook type
 * @param payload The JSON payload to send
 * @returns The JSON response from n8n
 */
export async function callN8NWebhook<T = any>(
  type: N8NWebhookType,
  payload: any
): Promise<T> {
  const webhookUrl = getWebhookUrl(type)

  console.log(`[n8n] Calling ${type} webhook:`, webhookUrl)
  console.log('[n8n] Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[n8n] ${type} webhook failed:`, response.status, errorText)
      throw new Error(`n8n ${type} webhook failed with status ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log(`[n8n] ${type} success:`, result)
    return result as T
  } catch (error: any) {
    console.error(`[n8n] ${type} exception:`, error)
    throw new Error(`Failed to call n8n ${type} webhook: ${error.message}`)
  }
}

/**
 * Check if a specific webhook is configured
 */
export function isWebhookConfigured(type: N8NWebhookType): boolean {
  try {
    getWebhookUrl(type)
    return true
  } catch {
    return false
  }
}

/**
 * Get n8n configuration status for all webhooks
 */
export function getN8nConfigStatus(): Record<N8NWebhookType, boolean> {
  return {
    CASE_ASSISTANT: isWebhookConfigured('CASE_ASSISTANT'),
    STRATEGY: isWebhookConfigured('STRATEGY'),
    CLIENT_PROFILE: isWebhookConfigured('CLIENT_PROFILE'),
    TRAINING: isWebhookConfigured('TRAINING'),
    INVOICE_REMINDER: isWebhookConfigured('INVOICE_REMINDER'),
    CONTRACT_ANALYZE: isWebhookConfigured('CONTRACT_ANALYZE'),
    HEARING_FOLLOWUP: isWebhookConfigured('HEARING_FOLLOWUP'),
    CLIENT_STATUS_NOTIFY: isWebhookConfigured('CLIENT_STATUS_NOTIFY'),
    DRAFT_GENERATOR: isWebhookConfigured('DRAFT_GENERATOR'),
    COLLECTION_ASSISTANT: isWebhookConfigured('COLLECTION_ASSISTANT'),
    DRAFT_REVIEWER: isWebhookConfigured('DRAFT_REVIEWER'),
    EMBEDDINGS: isWebhookConfigured('EMBEDDINGS'),
    PLEADING_GENERATOR: isWebhookConfigured('PLEADING_GENERATOR'),
    PLEADING_REVIEW: isWebhookConfigured('PLEADING_REVIEW'),
  }
}

// Legacy exports for backward compatibility
export async function triggerContractAnalyze(contractId: string): Promise<void> {
  await callN8NWebhook('CONTRACT_ANALYZE', {
    contractId,
    timestamp: new Date().toISOString(),
    source: 'lawsprinter',
  })
}

export async function triggerHearingFollowup(caseEventId: string): Promise<void> {
  await callN8NWebhook('HEARING_FOLLOWUP', {
    caseEventId,
    timestamp: new Date().toISOString(),
    source: 'lawsprinter',
  })
}

export async function triggerClientStatusNotify(caseEventId: string): Promise<void> {
  await callN8NWebhook('CLIENT_STATUS_NOTIFY', {
    caseEventId,
    timestamp: new Date().toISOString(),
    source: 'lawsprinter',
  })
}
