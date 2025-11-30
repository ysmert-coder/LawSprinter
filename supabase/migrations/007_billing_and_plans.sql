-- =====================================================
-- BILLING & SUBSCRIPTION SYSTEM
-- =====================================================
-- Migration: 007_billing_and_plans.sql
-- Purpose: Add billing, plans, AI settings, and usage tracking
-- Date: 2025-01-22

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. FIRM BILLING TABLE
-- =====================================================

CREATE TABLE public.firm_billing (
  firm_id UUID PRIMARY KEY REFERENCES public.firms(id) ON DELETE CASCADE,
  
  -- Plan information
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'SOLO', 'BURO_5', 'ENTERPRISE')),
  max_users INTEGER NOT NULL DEFAULT 1,
  
  -- Trial credits (one-time, 20 free AI calls)
  trial_credits_total INTEGER NOT NULL DEFAULT 20,
  trial_credits_used INTEGER NOT NULL DEFAULT 0,
  
  -- BYO (Bring Your Own) API Key
  has_byok BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Subscription validity
  subscription_valid_until TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT trial_credits_valid CHECK (trial_credits_used >= 0 AND trial_credits_used <= trial_credits_total)
);

-- Index for active subscription queries
CREATE INDEX idx_firm_billing_active ON public.firm_billing(firm_id, is_active, subscription_valid_until);

-- =====================================================
-- 2. FIRM AI SETTINGS TABLE (BYO API Key)
-- =====================================================

CREATE TABLE public.firm_ai_settings (
  firm_id UUID PRIMARY KEY REFERENCES public.firms(id) ON DELETE CASCADE,
  
  -- AI Provider configuration
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'openrouter', 'ollama', 'deepseek')),
  model TEXT NOT NULL, -- e.g., 'gpt-4o', 'gpt-4o-mini', 'deepseek-chat'
  
  -- Encrypted API key (using pgcrypto)
  api_key_encrypted TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. AI USAGE LOG TABLE
-- =====================================================

CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Feature/endpoint used
  feature TEXT NOT NULL CHECK (feature IN (
    'CASE_ASSISTANT',
    'STRATEGY',
    'PLEADING_GENERATE',
    'PLEADING_REVIEW',
    'DRAFT_GENERATOR',
    'DRAFT_REVIEWER',
    'COLLECTION_ASSISTANT',
    'CONTRACT_ANALYZE',
    'TRAINING',
    'EMBEDDINGS'
  )),
  
  -- Token usage (optional, for cost tracking)
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  -- Credit tracking
  credits_used INTEGER NOT NULL DEFAULT 0,
  used_trial BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics and billing
CREATE INDEX idx_ai_usage_firm_date ON public.ai_usage_log(firm_id, created_at DESC);
CREATE INDEX idx_ai_usage_user ON public.ai_usage_log(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_feature ON public.ai_usage_log(feature, created_at DESC);
CREATE INDEX idx_ai_usage_trial ON public.ai_usage_log(firm_id, used_trial, created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.firm_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- firm_billing policies
CREATE POLICY "Users can view their firm's billing"
  ON public.firm_billing FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Firm owners can update billing"
  ON public.firm_billing FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- firm_ai_settings policies
CREATE POLICY "Users can view their firm's AI settings"
  ON public.firm_ai_settings FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Firm owners can manage AI settings"
  ON public.firm_ai_settings FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ai_usage_log policies
CREATE POLICY "Users can view their firm's usage logs"
  ON public.ai_usage_log FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs"
  ON public.ai_usage_log FOR INSERT
  WITH CHECK (true); -- Service role will handle inserts

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER set_updated_at_firm_billing
  BEFORE UPDATE ON public.firm_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_firm_ai_settings
  BEFORE UPDATE ON public.firm_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENCRYPTION/DECRYPTION FUNCTIONS
-- =====================================================

-- Function to encrypt text (API keys)
CREATE OR REPLACE FUNCTION encrypt_text(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(plain_text, encryption_key), 'base64');
END;
$$;

-- Function to decrypt text (API keys)
CREATE OR REPLACE FUNCTION decrypt_text(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), encryption_key);
END;
$$;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get remaining trial credits
CREATE OR REPLACE FUNCTION get_remaining_trial_credits(p_firm_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  SELECT trial_credits_total, trial_credits_used
  INTO v_total, v_used
  FROM public.firm_billing
  WHERE firm_id = p_firm_id;
  
  IF NOT FOUND THEN
    RETURN 20; -- Default for new firms
  END IF;
  
  RETURN GREATEST(0, v_total - v_used);
END;
$$;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(p_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_valid_until TIMESTAMPTZ;
  v_is_active BOOLEAN;
BEGIN
  SELECT plan, subscription_valid_until, is_active
  INTO v_plan, v_valid_until, v_is_active
  FROM public.firm_billing
  WHERE firm_id = p_firm_id;
  
  IF NOT FOUND THEN
    RETURN TRUE; -- New firms default to FREE (always active)
  END IF;
  
  -- FREE plan is always active (limited by credits only)
  IF v_plan = 'FREE' THEN
    RETURN TRUE;
  END IF;
  
  -- SOLO, BURO_5, ENTERPRISE require valid subscription
  IF v_is_active AND (v_valid_until IS NULL OR v_valid_until >= NOW()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to increment trial credits used
CREATE OR REPLACE FUNCTION increment_trial_credits(p_firm_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.firm_billing
  SET 
    trial_credits_used = trial_credits_used + p_amount,
    updated_at = NOW()
  WHERE firm_id = p_firm_id;
END;
$$;

-- Alias for consistency with service layer
CREATE OR REPLACE FUNCTION increment_trial_credits_used(p_firm_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_trial_credits(p_firm_id, p_amount);
END;
$$;

-- =====================================================
-- 8. INITIALIZE BILLING FOR EXISTING FIRMS
-- =====================================================

-- Create billing records for existing firms (FREE plan, 20 credits)
INSERT INTO public.firm_billing (firm_id, plan, max_users, trial_credits_total, trial_credits_used, has_byok, is_active)
SELECT 
  id,
  'FREE',
  1,
  20,
  0,
  FALSE,
  TRUE
FROM public.firms
WHERE id NOT IN (SELECT firm_id FROM public.firm_billing)
ON CONFLICT (firm_id) DO NOTHING;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE public.firm_billing IS 'Billing and subscription information for firms';
COMMENT ON TABLE public.firm_ai_settings IS 'BYO (Bring Your Own) API key settings for AI providers';
COMMENT ON TABLE public.ai_usage_log IS 'Log of all AI feature usage for billing and analytics';

COMMENT ON COLUMN public.firm_billing.plan IS 'Subscription plan: FREE (trial credits only), SOLO (1 user), BURO_5 (5 users), ENTERPRISE (custom)';
COMMENT ON COLUMN public.firm_billing.trial_credits_total IS 'Total one-time free AI credits (default 20)';
COMMENT ON COLUMN public.firm_billing.trial_credits_used IS 'Number of trial credits consumed';
COMMENT ON COLUMN public.firm_billing.has_byok IS 'Whether firm has configured their own API key (bypasses credit system)';
COMMENT ON COLUMN public.firm_billing.subscription_valid_until IS 'Subscription expiry date (NULL for FREE plan)';

COMMENT ON COLUMN public.firm_ai_settings.api_key_encrypted IS 'Encrypted API key using pgcrypto (decrypt with PG_ENCRYPTION_KEY)';
COMMENT ON COLUMN public.ai_usage_log.used_trial IS 'Whether this call used trial credits (false if BYO key)';

