-- LawSprinter Database Schema
-- Multi-tenant B2B SaaS for Legal Management
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Firms (Organizations/Companies)
CREATE TABLE public.firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (Users belonging to firms)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'lawyer', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients (Müvekkiller)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cases (Dosyalar/Davalar)
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  case_number TEXT,
  type TEXT NOT NULL CHECK (type IN ('civil', 'criminal', 'commercial', 'labor', 'family', 'administrative', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks (Görevler)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  assignee_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deadlines (Süreler)
CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hearing', 'filing', 'response', 'appeal', 'other')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  critical_level TEXT NOT NULL DEFAULT 'medium' CHECK (critical_level IN ('low', 'medium', 'high', 'critical')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (Belgeler)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('petition', 'contract', 'evidence', 'decision', 'correspondence', 'other')),
  storage_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts (Sözleşmeler)
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  expiry_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  summary_for_lawyer TEXT,
  summary_for_client TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'renewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case Events (Dava Olayları)
CREATE TABLE public.case_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  visible_to_client BOOLEAN NOT NULL DEFAULT TRUE,
  client_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications (Bildirimler)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Summaries (Günlük Özetler)
CREATE TABLE public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(firm_id, summary_date)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_firm_id ON public.profiles(firm_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Clients
CREATE INDEX idx_clients_firm_id ON public.clients(firm_id);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Cases
CREATE INDEX idx_cases_firm_id ON public.cases(firm_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_created_at ON public.cases(created_at DESC);

-- Tasks
CREATE INDEX idx_tasks_firm_id ON public.tasks(firm_id);
CREATE INDEX idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_profile_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Deadlines
CREATE INDEX idx_deadlines_firm_id ON public.deadlines(firm_id);
CREATE INDEX idx_deadlines_case_id ON public.deadlines(case_id);
CREATE INDEX idx_deadlines_date ON public.deadlines(date);
CREATE INDEX idx_deadlines_completed ON public.deadlines(completed);

-- Documents
CREATE INDEX idx_documents_firm_id ON public.documents(firm_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Contracts
CREATE INDEX idx_contracts_firm_id ON public.contracts(firm_id);
CREATE INDEX idx_contracts_case_id ON public.contracts(case_id);
CREATE INDEX idx_contracts_expiry_date ON public.contracts(expiry_date);
CREATE INDEX idx_contracts_status ON public.contracts(status);

-- Case Events
CREATE INDEX idx_case_events_firm_id ON public.case_events(firm_id);
CREATE INDEX idx_case_events_case_id ON public.case_events(case_id);
CREATE INDEX idx_case_events_event_date ON public.case_events(event_date DESC);

-- Notifications
CREATE INDEX idx_notifications_firm_id ON public.notifications(firm_id);
CREATE INDEX idx_notifications_client_id ON public.notifications(client_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Daily Summaries
CREATE INDEX idx_daily_summaries_firm_id ON public.daily_summaries(firm_id);
CREATE INDEX idx_daily_summaries_date ON public.daily_summaries(summary_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Firms: Users can view their own firm
CREATE POLICY "Users can view own firm"
  ON public.firms FOR SELECT
  USING (
    id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Clients: Users can only access clients from their firm
CREATE POLICY "Users can view own firm clients"
  ON public.clients FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm clients"
  ON public.clients FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm clients"
  ON public.clients FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Cases: Users can only access cases from their firm
CREATE POLICY "Users can view own firm cases"
  ON public.cases FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm cases"
  ON public.cases FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm cases"
  ON public.cases FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm cases"
  ON public.cases FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Tasks: Users can only access tasks from their firm
CREATE POLICY "Users can view own firm tasks"
  ON public.tasks FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm tasks"
  ON public.tasks FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm tasks"
  ON public.tasks FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Deadlines: Users can only access deadlines from their firm
CREATE POLICY "Users can view own firm deadlines"
  ON public.deadlines FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm deadlines"
  ON public.deadlines FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm deadlines"
  ON public.deadlines FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm deadlines"
  ON public.deadlines FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Documents: Users can only access documents from their firm
CREATE POLICY "Users can view own firm documents"
  ON public.documents FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm documents"
  ON public.documents FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm documents"
  ON public.documents FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Contracts: Users can only access contracts from their firm
CREATE POLICY "Users can view own firm contracts"
  ON public.contracts FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm contracts"
  ON public.contracts FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm contracts"
  ON public.contracts FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Case Events: Users can only access case events from their firm
CREATE POLICY "Users can view own firm case_events"
  ON public.case_events FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm case_events"
  ON public.case_events FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm case_events"
  ON public.case_events FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own firm case_events"
  ON public.case_events FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Notifications: Users can only access notifications from their firm
CREATE POLICY "Users can view own firm notifications"
  ON public.notifications FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own firm notifications"
  ON public.notifications FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Daily Summaries: Users can only access summaries from their firm
CREATE POLICY "Users can view own firm summaries"
  ON public.daily_summaries FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own firm summaries"
  ON public.daily_summaries FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_firm_id UUID;
BEGIN
  -- Create a new firm for the user
  INSERT INTO public.firms (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Law Firm'))
  RETURNING id INTO new_firm_id;

  -- Create profile for the user
  INSERT INTO public.profiles (id, firm_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_firm_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create firm and profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.firms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.case_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.firms IS 'Law firms/organizations';
COMMENT ON TABLE public.profiles IS 'User profiles linked to firms';
COMMENT ON TABLE public.clients IS 'Clients (müvekkiller)';
COMMENT ON TABLE public.cases IS 'Legal cases/files (dosyalar)';
COMMENT ON TABLE public.tasks IS 'Tasks assigned to cases';
COMMENT ON TABLE public.deadlines IS 'Important deadlines (süreler)';
COMMENT ON TABLE public.documents IS 'Documents related to cases';
COMMENT ON TABLE public.contracts IS 'Contracts with AI analysis';
COMMENT ON TABLE public.case_events IS 'Events/updates for cases';
COMMENT ON TABLE public.notifications IS 'Notifications sent to clients';
COMMENT ON TABLE public.daily_summaries IS 'Daily AI-generated summaries';

