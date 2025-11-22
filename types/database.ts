export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          firm_id: string
          email: string
          full_name: string | null
          role: 'owner' | 'admin' | 'lawyer' | 'member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          firm_id: string
          email: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'lawyer' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'lawyer' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          firm_id: string
          full_name: string
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          }
        ]
      }
      cases: {
        Row: {
          id: string
          firm_id: string
          client_id: string | null
          title: string
          case_number: string | null
          type: 'civil' | 'criminal' | 'commercial' | 'labor' | 'family' | 'administrative' | 'other'
          status: 'active' | 'pending' | 'closed' | 'archived'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          client_id?: string | null
          title: string
          case_number?: string | null
          type: 'civil' | 'criminal' | 'commercial' | 'labor' | 'family' | 'administrative' | 'other'
          status?: 'active' | 'pending' | 'closed' | 'archived'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          client_id?: string | null
          title?: string
          case_number?: string | null
          type?: 'civil' | 'criminal' | 'commercial' | 'labor' | 'family' | 'administrative' | 'other'
          status?: 'active' | 'pending' | 'closed' | 'archived'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          firm_id: string
          case_id: string | null
          assignee_profile_id: string | null
          title: string
          description: string | null
          due_date: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_id?: string | null
          assignee_profile_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_id?: string | null
          assignee_profile_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_profile_id_fkey"
            columns: ["assignee_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      deadlines: {
        Row: {
          id: string
          firm_id: string
          case_id: string | null
          type: 'hearing' | 'filing' | 'response' | 'appeal' | 'other'
          description: string
          date: string
          critical_level: 'low' | 'medium' | 'high' | 'critical'
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_id?: string | null
          type: 'hearing' | 'filing' | 'response' | 'appeal' | 'other'
          description: string
          date: string
          critical_level?: 'low' | 'medium' | 'high' | 'critical'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_id?: string | null
          type?: 'hearing' | 'filing' | 'response' | 'appeal' | 'other'
          description?: string
          date?: string
          critical_level?: 'low' | 'medium' | 'high' | 'critical'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          firm_id: string
          case_id: string | null
          title: string
          type: 'petition' | 'contract' | 'evidence' | 'decision' | 'correspondence' | 'other'
          storage_path: string | null
          file_size: number | null
          mime_type: string | null
          ai_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_id?: string | null
          title: string
          type: 'petition' | 'contract' | 'evidence' | 'decision' | 'correspondence' | 'other'
          storage_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          ai_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_id?: string | null
          title?: string
          type?: 'petition' | 'contract' | 'evidence' | 'decision' | 'correspondence' | 'other'
          storage_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          ai_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          firm_id: string
          case_id: string | null
          document_id: string | null
          title: string
          expiry_date: string | null
          notice_period_days: number | null
          risk_score: number | null
          summary_for_lawyer: string | null
          summary_for_client: string | null
          status: 'active' | 'expiring_soon' | 'expired' | 'renewed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_id?: string | null
          document_id?: string | null
          title: string
          expiry_date?: string | null
          notice_period_days?: number | null
          risk_score?: number | null
          summary_for_lawyer?: string | null
          summary_for_client?: string | null
          status?: 'active' | 'expiring_soon' | 'expired' | 'renewed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_id?: string | null
          document_id?: string | null
          title?: string
          expiry_date?: string | null
          notice_period_days?: number | null
          risk_score?: number | null
          summary_for_lawyer?: string | null
          summary_for_client?: string | null
          status?: 'active' | 'expiring_soon' | 'expired' | 'renewed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_document_id_fkey"
            columns: ["document_id"]
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      case_events: {
        Row: {
          id: string
          firm_id: string
          case_id: string
          title: string
          description: string | null
          event_date: string
          visible_to_client: boolean
          client_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          case_id: string
          title: string
          description?: string | null
          event_date: string
          visible_to_client?: boolean
          client_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          case_id?: string
          title?: string
          description?: string | null
          event_date?: string
          visible_to_client?: boolean
          client_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_events_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_events_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          firm_id: string
          client_id: string | null
          case_id: string | null
          channel: 'email' | 'sms' | 'whatsapp' | 'in_app'
          subject: string
          content: string
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          client_id?: string | null
          case_id?: string | null
          channel: 'email' | 'sms' | 'whatsapp' | 'in_app'
          subject: string
          content: string
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          client_id?: string | null
          case_id?: string | null
          channel?: 'email' | 'sms' | 'whatsapp' | 'in_app'
          subject?: string
          content?: string
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_summaries: {
        Row: {
          id: string
          firm_id: string
          summary_date: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          summary_date: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          summary_date?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          }
        ]
      }
      legal_documents: {
        Row: {
          id: string
          title: string
          source: string
          doc_type: string
          court: string | null
          chamber: string | null
          decision_no: string | null
          file_no: string | null
          date: string | null
          url: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          source: string
          doc_type: string
          court?: string | null
          chamber?: string | null
          decision_no?: string | null
          file_no?: string | null
          date?: string | null
          url?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          source?: string
          doc_type?: string
          court?: string | null
          chamber?: string | null
          decision_no?: string | null
          file_no?: string | null
          date?: string | null
          url?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_chunks: {
        Row: {
          id: number
          document_id: string
          chunk_index: number
          content: string
          embedding: number[] // vector(1536) represented as number array
          created_at: string
        }
        Insert: {
          id?: number
          document_id: string
          chunk_index: number
          content: string
          embedding: number[] | string // Can be array or pgvector string format
          created_at?: string
        }
        Update: {
          id?: number
          document_id?: string
          chunk_index?: number
          content?: string
          embedding?: number[] | string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_chunks_document_id_fkey"
            columns: ["document_id"]
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      private_case_chunks: {
        Row: {
          id: number
          user_id: string
          case_id: string
          source: string
          content: string
          embedding: number[] // vector(1536) represented as number array
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          case_id: string
          source: string
          content: string
          embedding: number[] | string // Can be array or pgvector string format
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          case_id?: string
          source?: string
          content?: string
          embedding?: number[] | string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_case_chunks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_case_chunks_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_legal_documents: {
        Args: {
          query_embedding: number[] | string
          match_count?: number
          doc_type_filter?: string | null
          court_filter?: string | null
        }
        Returns: {
          document_id: string
          chunk_id: number
          title: string
          source: string
          doc_type: string
          court: string | null
          chamber: string | null
          decision_no: string | null
          date: string | null
          url: string | null
          content: string
          similarity: number
        }[]
      }
      search_private_case_chunks: {
        Args: {
          p_user_id: string
          p_case_id: string
          query_embedding: number[] | string
          match_count?: number
        }
        Returns: {
          chunk_id: number
          source: string
          content: string
          similarity: number
          created_at: string
        }[]
      }
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'lawyer' | 'member'
      case_type: 'civil' | 'criminal' | 'commercial' | 'labor' | 'family' | 'administrative' | 'other'
      case_status: 'active' | 'pending' | 'closed' | 'archived'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      task_priority: 'low' | 'medium' | 'high' | 'critical'
      deadline_type: 'hearing' | 'filing' | 'response' | 'appeal' | 'other'
      document_type: 'petition' | 'contract' | 'evidence' | 'decision' | 'correspondence' | 'other'
      contract_status: 'active' | 'expiring_soon' | 'expired' | 'renewed'
      notification_channel: 'email' | 'sms' | 'whatsapp' | 'in_app'
      notification_status: 'pending' | 'sent' | 'failed' | 'delivered'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific type exports for convenience
export type Firm = Tables<'firms'>
export type Profile = Tables<'profiles'>
export type Client = Tables<'clients'>
export type Case = Tables<'cases'>
export type Task = Tables<'tasks'>
export type Deadline = Tables<'deadlines'>
export type Document = Tables<'documents'>
export type Contract = Tables<'contracts'>
export type CaseEvent = Tables<'case_events'>
export type Notification = Tables<'notifications'>
export type DailySummary = Tables<'daily_summaries'>

// RAG System types
export type LegalDocument = Tables<'legal_documents'>
export type LegalChunk = Tables<'legal_chunks'>
export type PrivateCaseChunk = Tables<'private_case_chunks'>

// Vector search result types
export type LegalSearchResult = Database['public']['Functions']['search_legal_documents']['Returns'][0]
export type PrivateCaseSearchResult = Database['public']['Functions']['search_private_case_chunks']['Returns'][0]

// Accounting types
export interface Invoice {
  id: string
  firm_id: string
  user_id?: string | null
  case_id?: string | null
  client_id?: string | null
  invoice_number?: string | null
  description: string
  amount: number
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP'
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  due_date?: string | null
  issued_at?: string | null
  paid_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  firm_id: string
  user_id?: string | null
  invoice_id: string
  amount: number
  payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'check' | 'eft' | 'other' | null
  paid_at: string
  notes?: string | null
  created_at: string
}

export interface InvoiceWithRelations extends Invoice {
  client?: {
    id: string
    full_name: string
    email?: string | null
  } | null
  case?: {
    id: string
    title: string
    case_number?: string | null
  } | null
  payments?: Payment[]
}

export interface AccountingSummary {
  totalReceivable: number
  monthCollected: number
  overdueCount: number
  overdueTotal: number
}

// Installment types
export type InstallmentStatus = 'pending' | 'paid' | 'overdue'
export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP'

export interface InvoiceInstallment {
  id: string
  invoice_id: string
  user_id: string
  firm_id: string
  due_date: string
  amount: number
  currency: Currency
  status: InstallmentStatus
  paid_at?: string | null
  note?: string | null
  created_at: string
}

export interface InvoiceInstallmentInput {
  dueDate: string
  amount: number
  currency?: Currency
  note?: string
}

export interface InstallmentSummary {
  totalCount: number
  paidCount: number
  overdueCount: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

// Client Messages types
export type MessageDirection = 'inbound' | 'outbound'
export type MessageChannel = 'whatsapp' | 'telegram' | 'email' | 'portal' | 'sms' | 'note'

export interface ClientMessage {
  id: string
  firm_id: string
  client_id: string
  direction: MessageDirection
  channel: MessageChannel
  message_text: string
  metadata?: any
  read_at?: string | null
  created_at: string
}

export interface ClientMessageInput {
  direction: MessageDirection
  channel: MessageChannel
  message_text: string
  metadata?: any
}

// Client Profiles types
export type RiskLevel = 'low' | 'medium' | 'high'

export interface ClientProfile {
  id: string
  firm_id: string
  client_id: string
  sentiment_score?: number | null // -1 to 1
  risk_level?: RiskLevel | null
  communication_style?: string | null
  emotional_state?: string | null
  json_profile?: any
  last_analysis_at: string
  created_at: string
  updated_at: string
}

export interface ClientProfileInput {
  sentiment_score?: number
  risk_level?: RiskLevel
  communication_style?: string
  emotional_state?: string
  json_profile?: any
}

// Client with relations
export interface ClientWithDetails {
  id: string
  user_id: string
  firm_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  profile?: ClientProfile | null
  open_cases_count?: number
  total_invoiced?: number
  total_paid?: number
}
