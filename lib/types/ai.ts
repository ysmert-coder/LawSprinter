/**
 * AI Response Types
 * 
 * Common types for AI-powered features using n8n webhooks
 * These types define the expected response structure from RAG-enabled workflows
 */

/**
 * Legal source from RAG system
 * Represents a case law precedent or legal document
 */
export type LegalSource = {
  /** Unique identifier for the source (optional) */
  id?: string
  /** Title or name of the legal document/case */
  title?: string
  /** Court that issued the decision */
  court?: string
  /** URL to the full document (optional) */
  url?: string
  /** Similarity score from vector search (0-1) */
  similarity?: number
  /** Source scope: public (shared) or private (user-specific) */
  scope?: 'public' | 'private'
  /** Text snippet from the source (truncated) */
  snippet?: string
}

/**
 * Case Assistant Response
 * 
 * Response from CASE_ASSISTANT n8n workflow
 * Analyzes uploaded case files and provides legal analysis
 */
export type CaseAssistantResponse = {
  /** Summary of the case/event */
  eventSummary: string
  /** Suggested defence outline/strategy */
  defenceOutline: string
  /** List of action items to take */
  actionItems: string[]
  /** Case strengths (optional) */
  strengths?: string[]
  /** Case weaknesses (optional) */
  weaknesses?: string[]
  /** Additional recommendations (optional) */
  recommendations?: string[]
  /** Related legal sources from RAG (optional) */
  sources?: LegalSource[]
  /** AI confidence score 0-1 (optional) */
  confidenceScore?: number
}

/**
 * Strategy Response
 * 
 * Response from STRATEGY n8n workflow
 * Provides area-specific legal strategy recommendations
 */
export type StrategyResponse = {
  /** High-level summary of the strategy */
  summary: string
  /** Key legal issues to address */
  keyIssues: string[]
  /** Recommended legal strategy */
  recommendedStrategy: string
  /** Potential risks to consider (optional) */
  risks?: string[]
  /** Related legal sources from RAG (optional) */
  sources?: LegalSource[]
  /** AI confidence score 0-1 (optional) */
  confidenceScore?: number
}

/**
 * Case Assistant Request
 * 
 * Request payload for CASE_ASSISTANT endpoint
 */
export type CaseAssistantRequest = {
  /** URL to the uploaded case file */
  fileUrl: string
  /** Type of case (e.g., 'labor', 'criminal', 'civil') */
  caseType: string
  /** Optional short description of the case */
  shortDescription?: string
}

/**
 * Strategy Request
 * 
 * Request payload for STRATEGY endpoint
 */
export type StrategyRequest = {
  /** Legal area (e.g., 'ceza', 'gayrimenkul', 'icra_iflas', 'aile') */
  area: string
  /** Question or situation description */
  question: string
  /** Optional file URL for context */
  fileUrl?: string
}

/**
 * Draft Type
 * 
 * Types of legal drafts that can be generated
 */
export type DraftType = 'dava_dilekcesi' | 'cevap_dilekcesi' | 'istinaf' | 'temyiz'

/**
 * Draft Generator Request
 * 
 * Request payload for DRAFT_GENERATOR endpoint
 */
export type DraftGeneratorRequest = {
  /** Case ID */
  caseId: string
  /** Type of case (e.g., 'labor', 'criminal', 'civil') */
  caseType: string
  /** Type of draft to generate */
  draftType: DraftType
  /** Fact summary / case description */
  factSummary: string
}

/**
 * Draft Generator Response
 * 
 * Response from DRAFT_GENERATOR n8n workflow
 * Generates legal document drafts (petitions, responses, appeals)
 */
export type DraftGeneratorResponse = {
  /** Generated draft text */
  draftText: string
  /** Legal sources used (RAG) */
  usedSources?: LegalSource[]
  /** Action items / checklist */
  actionItems?: string[]
  /** Additional notes or warnings */
  notes?: string
}

/**
 * Draft Review Request
 * 
 * Request payload for DRAFT_REVIEWER endpoint
 */
export type DraftReviewRequest = {
  /** Optional case ID for context */
  caseId?: string
  /** Optional case type for context */
  caseType?: string
  /** Draft text to review */
  draftText: string
}

/**
 * Draft Review Response
 * 
 * Response from DRAFT_REVIEWER n8n workflow
 * Reviews legal drafts and provides feedback
 */
export type DraftReviewResponse = {
  /** Identified issues and problems */
  issues: string[]
  /** Suggestions to improve the draft */
  suggestions: string[]
  /** Suggested legal citations (RAG) */
  suggestedCitations?: LegalSource[]
  /** Overall assessment comment */
  overallComment?: string
}

