/**
 * AI Service Layer
 * 
 * All AI operations are delegated to n8n webhooks.
 * No direct AI provider dependencies in Next.js code.
 */

import { callN8NWebhook } from '../n8n'

/**
 * Case Assistant AI Response
 */
export interface CaseAssistantResponse {
  eventSummary: string
  defenceOutline: string
  actionItems: string[]
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]
}

/**
 * Strategy AI Response
 */
export interface StrategyResponse {
  summary: string
  keyIssues: string[]
  recommendedStrategy: string
  risks: string[]
  alternativeStrategies?: string[]
  precedents?: string[]
}

/**
 * Client Profile AI Response
 */
export interface ClientProfileResponse {
  sentimentScore: number // -1 to 1
  riskLevel: 'low' | 'medium' | 'high'
  communicationStyle: string
  emotionalState: string
  recommendations: string[]
  profileSummary: string
}

/**
 * Training Content AI Response
 */
export interface TrainingContentResponse {
  outline: string[]
  content: string
  keyTakeaways: string[]
  practicalExamples?: string[]
  resources?: string[]
}

/**
 * Analyze a case with AI
 * 
 * @param payload Case analysis request
 * @returns AI-generated case analysis
 */
export async function analyzeCaseWithAI(payload: {
  userId: string
  fileUrl?: string
  caseType: string
  shortDescription?: string
  caseId?: string
}): Promise<CaseAssistantResponse> {
  try {
    const response = await callN8NWebhook<CaseAssistantResponse>('CASE_ASSISTANT', {
      ...payload,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    console.error('[analyzeCaseWithAI] Error:', error)
    throw new Error('Dava analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
  }
}

/**
 * Generate legal strategy with AI
 * 
 * @param payload Strategy generation request
 * @returns AI-generated strategy
 */
export async function generateStrategyWithAI(payload: {
  userId: string
  area: 'criminal' | 'real_estate' | 'enforcement' | 'family' | 'commercial' | 'labor' | 'other'
  fileUrl?: string
  question: string
  caseId?: string
}): Promise<StrategyResponse> {
  try {
    const response = await callN8NWebhook<StrategyResponse>('STRATEGY', {
      ...payload,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    console.error('[generateStrategyWithAI] Error:', error)
    throw new Error('Strateji oluşturma sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
  }
}

/**
 * Analyze client profile with AI
 * 
 * @param payload Client profile analysis request
 * @returns AI-generated client profile
 */
export async function analyzeClientProfileWithAI(payload: {
  userId: string
  clientId: string
  lastMessage?: string
  allMessages: Array<{
    direction: 'inbound' | 'outbound'
    message: string
    timestamp: string
  }>
  currentProfile?: any
}): Promise<ClientProfileResponse> {
  try {
    const response = await callN8NWebhook<ClientProfileResponse>('CLIENT_PROFILE', {
      ...payload,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    console.error('[analyzeClientProfileWithAI] Error:', error)
    throw new Error('Müşteri profil analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
  }
}

/**
 * Generate training content with AI
 * 
 * @param payload Training content request
 * @returns AI-generated training content
 */
export async function generateTrainingContentWithAI(payload: {
  userId: string
  topic: string
  level: 'intern' | 'junior' | 'senior'
  format: 'notes' | 'qa' | 'checklist' | 'case_study'
}): Promise<TrainingContentResponse> {
  try {
    const response = await callN8NWebhook<TrainingContentResponse>('TRAINING', {
      ...payload,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    console.error('[generateTrainingContentWithAI] Error:', error)
    throw new Error('Eğitim içeriği oluşturma sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
  }
}

/**
 * Generate payment reminder message with AI
 * 
 * @param payload Invoice reminder request
 * @returns AI-generated reminder message
 */
export async function generatePaymentReminderWithAI(payload: {
  userId: string
  invoiceId: string
  clientName: string
  amount: number
  currency: string
  dueDate: string
  daysOverdue: number
}): Promise<{ message: string; subject?: string }> {
  try {
    const response = await callN8NWebhook<{ message: string; subject?: string }>(
      'INVOICE_REMINDER',
      {
        ...payload,
        timestamp: new Date().toISOString(),
      }
    )

    return response
  } catch (error) {
    console.error('[generatePaymentReminderWithAI] Error:', error)
    throw new Error('Ödeme hatırlatma mesajı oluşturma sırasında bir hata oluştu.')
  }
}

