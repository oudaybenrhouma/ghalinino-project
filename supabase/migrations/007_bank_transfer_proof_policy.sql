-- ============================================================================
-- Migration 007: Allow users to submit bank transfer proof on their own orders
-- ============================================================================
--
-- Problem: No RLS UPDATE policy existed for users to write bank_transfer_proof_url.
-- Supabase silently blocks it (0 rows updated, no error returned).
--
-- The order_status enum values are:
--   pending | paid | processing | shipped | delivered | cancelled | refunded
-- (there is no 'payment_pending' value)
-- ============================================================================

CREATE POLICY "orders_update_proof_own"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status NOT IN ('cancelled', 'delivered', 'refunded')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'paid', 'processing', 'shipped')
  );