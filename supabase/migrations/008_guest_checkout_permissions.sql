-- ============================================================================
-- Migration 008: Fix guest checkout — grant anon role table permissions
-- ============================================================================
--
-- Problem: Guest orders fail with a DB constraint error:
--   "order_customer_check" requires user_id IS NOT NULL OR
--   (guest_email IS NOT NULL AND guest_phone IS NOT NULL)
--
-- The create_order RPC is SECURITY DEFINER so it runs as the DB owner and
-- bypasses RLS — but the anon role still needs INSERT permission on the
-- underlying tables for Postgres to allow the function to proceed on its
-- behalf in some Supabase configurations.
--
-- Additionally, the ShippingForm never collected guest_email, so the
-- constraint was always violated for guests. That is fixed in the frontend.
-- This migration adds the safety net on the DB side.
-- ============================================================================

-- Allow anon to call the RPC (already granted in 003, repeated for safety)
GRANT EXECUTE ON FUNCTION create_order TO anon;

-- Allow anon INSERT on orders and order_items so the SECURITY DEFINER RPC
-- can insert on behalf of an anonymous session
GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;

-- Allow anon to read products (for stock checking inside the RPC)
GRANT SELECT ON products TO anon;
GRANT UPDATE ON products TO anon;

-- Sequences used by the tables
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;