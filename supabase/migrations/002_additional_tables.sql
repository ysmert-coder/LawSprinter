-- Additional tables for LawSprinter features

-- Client Messages Table (for WhatsApp/Telegram/Email communication tracking)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'email', 'sms')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'pending_approval', 'sent', 'delivered', 'read', 'failed')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Scenarios Table (for Avukat Akademi)
CREATE TABLE IF NOT EXISTS public.training_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL CHECK (subject IN ('civil', 'criminal', 'administrative', 'commercial', 'labor', 'family', 'other')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  scenario_content JSONB NOT NULL, -- Contains the full scenario data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Results Table
CREATE TABLE IF NOT EXISTS public.training_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.training_scenarios(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- User's answers
  feedback JSONB, -- AI-generated feedback
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Finances Table (for Muhasebe)
CREATE TABLE IF NOT EXISTS public.case_finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fee', 'cost', 'expense', 'payment')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_messages_firm_id ON public.client_messages(firm_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_client_id ON public.client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_case_id ON public.client_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_created_at ON public.client_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_results_firm_id ON public.training_results(firm_id);
CREATE INDEX IF NOT EXISTS idx_training_results_profile_id ON public.training_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_training_results_scenario_id ON public.training_results(scenario_id);

CREATE INDEX IF NOT EXISTS idx_case_finances_firm_id ON public.case_finances(firm_id);
CREATE INDEX IF NOT EXISTS idx_case_finances_case_id ON public.case_finances(case_id);
CREATE INDEX IF NOT EXISTS idx_case_finances_status ON public.case_finances(status);
CREATE INDEX IF NOT EXISTS idx_case_finances_due_date ON public.case_finances(due_date);

-- RLS Policies
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_finances ENABLE ROW LEVEL SECURITY;

-- Client Messages RLS
CREATE POLICY "Users can view their firm's client messages"
  ON public.client_messages FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert client messages for their firm"
  ON public.client_messages FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's client messages"
  ON public.client_messages FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Training Scenarios RLS (public read, admin write)
CREATE POLICY "Anyone can view training scenarios"
  ON public.training_scenarios FOR SELECT
  USING (true);

-- Training Results RLS
CREATE POLICY "Users can view their firm's training results"
  ON public.training_results FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own training results"
  ON public.training_results FOR INSERT
  WITH CHECK (
    profile_id = auth.uid() AND
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Case Finances RLS
CREATE POLICY "Users can view their firm's case finances"
  ON public.case_finances FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert case finances for their firm"
  ON public.case_finances FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's case finances"
  ON public.case_finances FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_client_messages_updated_at
  BEFORE UPDATE ON public.client_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_scenarios_updated_at
  BEFORE UPDATE ON public.training_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_finances_updated_at
  BEFORE UPDATE ON public.case_finances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

