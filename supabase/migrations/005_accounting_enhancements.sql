-- Accounting Enhancements Migration
-- Adds missing fields and improves invoices/payments tables
-- Run this after 003_extended_features.sql

-- =====================================================
-- UPDATE INVOICES TABLE
-- =====================================================

-- Add missing fields to invoices
DO $$ 
BEGIN
  -- Add user_id for direct user reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='invoices' AND column_name='user_id') THEN
    ALTER TABLE public.invoices ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add issued_at field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='invoices' AND column_name='issued_at') THEN
    ALTER TABLE public.invoices ADD COLUMN issued_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Update status check to include 'partial'
  ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
  ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'));
END $$;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- =====================================================
-- UPDATE PAYMENTS TABLE
-- =====================================================

-- Add user_id to payments
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='payments' AND column_name='user_id') THEN
    ALTER TABLE public.payments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Rename payment_date to paid_at for consistency
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='payments' AND column_name='payment_date') THEN
    ALTER TABLE public.payments RENAME COLUMN payment_date TO paid_at;
  END IF;
END $$;

-- Update payment_method values
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'eft', 'other'));

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their firm's invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage their firm's invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their firm's payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their firm's payments" ON public.payments;

-- Create new policies with user_id support
CREATE POLICY "Users can view their own or firm's invoices"
  ON public.invoices FOR SELECT
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own or firm's invoices"
  ON public.invoices FOR ALL
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own or firm's payments"
  ON public.payments FOR SELECT
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own or firm's payments"
  ON public.payments FOR ALL
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get accounting summary for a user
CREATE OR REPLACE FUNCTION get_accounting_summary(p_user_id UUID, p_firm_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_receivable DECIMAL;
  v_month_collected DECIMAL;
  v_overdue_count INTEGER;
  v_overdue_total DECIMAL;
  v_result JSON;
BEGIN
  -- Calculate total receivable (sent, partial, overdue)
  SELECT COALESCE(SUM(
    CASE 
      WHEN status = 'partial' THEN amount - COALESCE((
        SELECT SUM(amount) FROM public.payments 
        WHERE invoice_id = i.id
      ), 0)
      ELSE amount
    END
  ), 0)
  INTO v_total_receivable
  FROM public.invoices i
  WHERE (i.user_id = p_user_id OR i.firm_id = p_firm_id)
    AND i.status IN ('sent', 'partial', 'overdue');

  -- Calculate this month's collected payments
  SELECT COALESCE(SUM(amount), 0)
  INTO v_month_collected
  FROM public.payments p
  WHERE (p.user_id = p_user_id OR p.firm_id = p_firm_id)
    AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', CURRENT_DATE);

  -- Calculate overdue invoices
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO v_overdue_count, v_overdue_total
  FROM public.invoices i
  WHERE (i.user_id = p_user_id OR i.firm_id = p_firm_id)
    AND i.status IN ('sent', 'overdue')
    AND i.due_date < CURRENT_DATE;

  -- Build result JSON
  v_result := json_build_object(
    'totalReceivable', v_total_receivable,
    'monthCollected', v_month_collected,
    'overdueCount', v_overdue_count,
    'overdueTotal', v_overdue_total
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_amount DECIMAL;
  v_total_paid DECIMAL;
BEGIN
  -- Get invoice amount
  SELECT amount INTO v_invoice_amount
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;

  -- Update invoice status
  IF v_total_paid >= v_invoice_amount THEN
    UPDATE public.invoices
    SET status = 'paid', paid_at = NEW.paid_at
    WHERE id = NEW.invoice_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE public.invoices
    SET status = 'partial'
    WHERE id = NEW.invoice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status update
DROP TRIGGER IF EXISTS trigger_update_invoice_status ON public.payments;
CREATE TRIGGER trigger_update_invoice_status
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN public.invoices.user_id IS 'Direct reference to user who created the invoice';
COMMENT ON COLUMN public.invoices.issued_at IS 'When the invoice was issued/created';
COMMENT ON COLUMN public.payments.user_id IS 'Direct reference to user who recorded the payment';
COMMENT ON FUNCTION get_accounting_summary IS 'Returns accounting summary for a user/firm';
COMMENT ON FUNCTION update_invoice_status_on_payment IS 'Automatically updates invoice status when payment is added';

