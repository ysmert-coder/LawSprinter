-- Invoice Installments Migration
-- Adds installment/payment plan support for invoices
-- Run this after 005_accounting_enhancements.sql

-- =====================================================
-- INVOICE INSTALLMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoice_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_installments_invoice_id
  ON public.invoice_installments(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_installments_user_id
  ON public.invoice_installments(user_id);

CREATE INDEX IF NOT EXISTS idx_invoice_installments_firm_id
  ON public.invoice_installments(firm_id);

CREATE INDEX IF NOT EXISTS idx_invoice_installments_status
  ON public.invoice_installments(status);

CREATE INDEX IF NOT EXISTS idx_invoice_installments_due_date
  ON public.invoice_installments(due_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE public.invoice_installments ENABLE ROW LEVEL SECURITY;

-- Users can view their own or firm's installments
CREATE POLICY "Users can view their own or firm's installments"
  ON public.invoice_installments FOR SELECT
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can manage their own or firm's installments
CREATE POLICY "Users can manage their own or firm's installments"
  ON public.invoice_installments FOR ALL
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if all installments for an invoice are paid
CREATE OR REPLACE FUNCTION check_invoice_installments_paid(p_invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_installments INTEGER;
  v_paid_installments INTEGER;
BEGIN
  -- Count total installments
  SELECT COUNT(*) INTO v_total_installments
  FROM public.invoice_installments
  WHERE invoice_id = p_invoice_id;

  -- If no installments, return false
  IF v_total_installments = 0 THEN
    RETURN FALSE;
  END IF;

  -- Count paid installments
  SELECT COUNT(*) INTO v_paid_installments
  FROM public.invoice_installments
  WHERE invoice_id = p_invoice_id
    AND status = 'paid';

  -- Return true if all are paid
  RETURN v_paid_installments = v_total_installments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update invoice status when all installments are paid
CREATE OR REPLACE FUNCTION update_invoice_status_on_installment_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Check if all installments are paid
    IF check_invoice_installments_paid(NEW.invoice_id) THEN
      -- Update invoice status to paid
      UPDATE public.invoices
      SET 
        status = 'paid',
        paid_at = NEW.paid_at
      WHERE id = NEW.invoice_id;
    ELSE
      -- Update invoice status to partial (some installments paid)
      UPDATE public.invoices
      SET status = 'partial'
      WHERE id = NEW.invoice_id
        AND status NOT IN ('paid', 'cancelled');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic invoice status update
DROP TRIGGER IF EXISTS trigger_update_invoice_on_installment_payment ON public.invoice_installments;
CREATE TRIGGER trigger_update_invoice_on_installment_payment
  AFTER INSERT OR UPDATE ON public.invoice_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_installment_payment();

-- Function to update overdue installments
CREATE OR REPLACE FUNCTION update_overdue_installments(p_reference_date TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update pending installments that are past due
  UPDATE public.invoice_installments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < p_reference_date;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get installment summary for an invoice
CREATE OR REPLACE FUNCTION get_installment_summary(p_invoice_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_count INTEGER;
  v_paid_count INTEGER;
  v_overdue_count INTEGER;
  v_total_amount NUMERIC;
  v_paid_amount NUMERIC;
  v_remaining_amount NUMERIC;
  v_result JSON;
BEGIN
  -- Get counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COUNT(*) FILTER (WHERE status = 'overdue')
  INTO v_total_count, v_paid_count, v_overdue_count
  FROM public.invoice_installments
  WHERE invoice_id = p_invoice_id;

  -- Get amounts
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)
  INTO v_total_amount, v_paid_amount
  FROM public.invoice_installments
  WHERE invoice_id = p_invoice_id;

  v_remaining_amount := v_total_amount - v_paid_amount;

  -- Build result JSON
  v_result := json_build_object(
    'totalCount', v_total_count,
    'paidCount', v_paid_count,
    'overdueCount', v_overdue_count,
    'totalAmount', v_total_amount,
    'paidAmount', v_paid_amount,
    'remainingAmount', v_remaining_amount
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.invoice_installments IS 'Payment plan installments for invoices';
COMMENT ON COLUMN public.invoice_installments.status IS 'pending: not yet due/paid, paid: payment received, overdue: past due date';
COMMENT ON FUNCTION check_invoice_installments_paid IS 'Returns true if all installments for an invoice are paid';
COMMENT ON FUNCTION update_invoice_status_on_installment_payment IS 'Automatically updates invoice status when installment is paid';
COMMENT ON FUNCTION update_overdue_installments IS 'Updates pending installments to overdue status if past due date';
COMMENT ON FUNCTION get_installment_summary IS 'Returns summary statistics for installments of an invoice';

