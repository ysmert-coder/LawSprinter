-- LawSprinter Extended Features Migration
-- Adds tables for: client messages, client profiles, invoices, payments
-- Run this after 001_initial_schema.sql and 002_additional_tables.sql

-- =====================================================
-- CLIENT COMMUNICATION TABLES
-- =====================================================

-- Client Messages (WhatsApp, Telegram, Portal messages)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'email', 'portal', 'sms')),
  message_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_messages_client_id ON public.client_messages(client_id);
CREATE INDEX idx_client_messages_firm_id ON public.client_messages(firm_id);
CREATE INDEX idx_client_messages_created_at ON public.client_messages(created_at DESC);

-- Client Profiles (AI-generated psychological profiles)
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  communication_style TEXT,
  emotional_state TEXT,
  json_profile JSONB DEFAULT '{}',
  last_analysis_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE INDEX idx_client_profiles_client_id ON public.client_profiles(client_id);
CREATE INDEX idx_client_profiles_firm_id ON public.client_profiles(firm_id);

-- =====================================================
-- ACCOUNTING TABLES
-- =====================================================

-- Invoices (Faturalar)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_firm_id ON public.invoices(firm_id);
CREATE INDEX idx_invoices_case_id ON public.invoices(case_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- Payments (Ödemeler)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_firm_id ON public.payments(firm_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date DESC);

-- =====================================================
-- ADDITIONAL FIELDS FOR EXISTING TABLES
-- =====================================================

-- Add whatsapp_number and type to clients table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='whatsapp_number') THEN
    ALTER TABLE public.clients ADD COLUMN whatsapp_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='type') THEN
    ALTER TABLE public.clients ADD COLUMN type TEXT DEFAULT 'individual' 
      CHECK (type IN ('individual', 'corporate'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='tax_number') THEN
    ALTER TABLE public.clients ADD COLUMN tax_number TEXT;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Client Messages Policies
CREATE POLICY "Users can view their firm's client messages"
  ON public.client_messages FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their firm's client messages"
  ON public.client_messages FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Client Profiles Policies
CREATE POLICY "Users can view their firm's client profiles"
  ON public.client_profiles FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their firm's client profiles"
  ON public.client_profiles FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Invoices Policies
CREATE POLICY "Users can view their firm's invoices"
  ON public.invoices FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their firm's invoices"
  ON public.invoices FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Payments Policies
CREATE POLICY "Users can view their firm's payments"
  ON public.payments FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their firm's payments"
  ON public.payments FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get overdue invoices
CREATE OR REPLACE FUNCTION get_overdue_invoices(p_firm_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_number TEXT,
  client_name TEXT,
  amount DECIMAL,
  currency TEXT,
  due_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    c.full_name as client_name,
    i.amount,
    i.currency,
    i.due_date,
    (CURRENT_DATE - i.due_date)::INTEGER as days_overdue
  FROM public.invoices i
  LEFT JOIN public.clients c ON i.client_id = c.id
  WHERE i.firm_id = p_firm_id
    AND i.status IN ('sent', 'overdue')
    AND i.due_date < CURRENT_DATE
  ORDER BY i.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total receivables
CREATE OR REPLACE FUNCTION get_total_receivables(p_firm_id UUID)
RETURNS TABLE (
  currency TEXT,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.currency,
    SUM(i.amount) as total_amount
  FROM public.invoices i
  WHERE i.firm_id = p_firm_id
    AND i.status IN ('sent', 'overdue')
  GROUP BY i.currency;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.client_messages IS 'Stores all client communication messages across channels';
COMMENT ON TABLE public.client_profiles IS 'AI-generated psychological profiles for clients';
COMMENT ON TABLE public.invoices IS 'Financial invoices for legal services';
COMMENT ON TABLE public.payments IS 'Payment records for invoices';

