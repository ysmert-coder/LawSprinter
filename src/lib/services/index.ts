/**
 * LawSprinter Service Layer
 * 
 * Centralized service functions for interacting with Supabase
 * All services use server-side Supabase client and are type-safe
 */

// Cases
export {
  getFirmCases,
  createCase,
  getCaseById,
  updateCaseStatus,
  getCasesByStatus,
} from './cases'

// Contracts
export {
  createContractWithDocument,
  updateContractAnalysis,
  getExpiringContracts,
  getContractById,
  updateContractStatus,
} from './contracts'

// Deadlines
export {
  createDeadline,
  getUpcomingDeadlines,
  getCriticalDeadlines,
  markDeadlineCompleted,
  getOverdueDeadlines,
  getCaseDeadlines,
} from './deadlines'

// Case Events
export {
  createCaseEvent,
  markEventClientMessage,
  getCaseEvents,
  getClientVisibleEvents,
  toggleEventVisibility,
  getRecentFirmEvents,
  deleteCaseEvent,
} from './caseEvents'

// Daily Summaries
export {
  upsertDailySummary,
  getLatestSummary,
  getSummaryByDate,
  getSummariesByDateRange,
  getRecentSummaries,
  deleteDailySummary,
  getSummaryStats,
} from './dailySummaries'

