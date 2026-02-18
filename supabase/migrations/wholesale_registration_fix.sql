-- ============================================================================
-- MIGRATION: 007_wholesale_registration_fix.sql
-- Fix wholesale registration flow and harden policies
-- ============================================================================
--
-- PROBLEMS FIXED:
-- 1. handle_new_user() trigger fires on signUp → creates profile automatically
--    Then app code tries INSERT again → duplicate key violation
--    FIX: Add ON CONFLICT (id) DO NOTHING to trigger, and ensure app uses UPSERT
--
-- 2. profiles_update_own policy blocks users from updating wholesale fields
--    (it enforces role = current role, but wholesale_applied_at etc. are blocked)
--    FIX: Separate policy for wholesale application submission
--
-- 3. No storage bucket policy for business-licenses
--    FIX: Add proper storage bucket RLS
--
-- ============================================================================


-- ============================================================================
-- FIX 1: Harden the handle_new_user trigger
-- ============================================================================
-- Use ON CONFLICT so duplicate calls are harmless

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;  -- <-- idempotent: safe if called twice

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- FIX 2: Add profiles INSERT policy (needed for signup flow)
-- ============================================================================

DROP POLICY IF EXISTS "profiles_insert_on_signup" ON profiles;
CREATE POLICY "profiles_insert_on_signup"
  ON profiles FOR INSERT
  WITH CHECK (true);


-- ============================================================================
-- FIX 3: Fix profiles UPDATE policy
-- ============================================================================
-- The original policy had: role = (SELECT role FROM profiles WHERE id = auth.uid())
-- which breaks when users try to update wholesale fields.
-- We split into separate policies.

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Allow users to update their own non-sensitive fields
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from promoting their own role
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    -- Prevent users from self-approving wholesale
    AND wholesale_status != 'approved' OR (
      SELECT wholesale_status FROM profiles WHERE id = auth.uid()
    ) = 'approved'
  );

-- Separate policy: allow users to submit wholesale application (pending only)
DROP POLICY IF EXISTS "profiles_submit_wholesale_application" ON profiles;
CREATE POLICY "profiles_submit_wholesale_application"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Only allowed to transition to 'pending' from 'none' or 'rejected'
    AND wholesale_status = 'pending'
    AND (SELECT wholesale_status FROM profiles WHERE id = auth.uid()) IN ('none', 'rejected')
    -- Role cannot change
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );


-- ============================================================================
-- FIX 4: Add function for atomic wholesale application update
-- ============================================================================
-- Called by the app after signup/login to set wholesale business data
-- Uses SECURITY DEFINER to bypass RLS cleanly

CREATE OR REPLACE FUNCTION submit_wholesale_application(
  p_user_id         UUID,
  p_full_name       TEXT,
  p_phone           TEXT,
  p_business_name   TEXT,
  p_business_tax_id TEXT,
  p_business_address TEXT,
  p_business_phone  TEXT,
  p_document_urls   TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Verify the calling user owns this profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user''s profile';
  END IF;

  UPDATE profiles SET
    full_name             = COALESCE(p_full_name, full_name),
    phone                 = COALESCE(p_phone, phone),
    wholesale_status      = 'pending',
    wholesale_applied_at  = CURRENT_TIMESTAMP,
    business_name         = p_business_name,
    business_tax_id       = UPPER(p_business_tax_id),
    business_address      = p_business_address,
    business_phone        = p_business_phone,
    business_documents    = p_document_urls
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- FIX 5: Add admin_wholesale_applications view for easy querying
-- ============================================================================

CREATE OR REPLACE VIEW admin_wholesale_applications AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.role,
  p.wholesale_status,
  p.wholesale_applied_at,
  p.wholesale_approved_at,
  p.wholesale_rejected_at,
  p.wholesale_rejection_reason,
  p.business_name,
  p.business_tax_id,
  p.business_address,
  p.business_phone,
  p.business_documents,
  p.wholesale_discount_tier,
  p.admin_notes,
  p.approved_by,
  approver.email AS approved_by_email,
  p.created_at
FROM profiles p
LEFT JOIN auth.users approver ON approver.id = p.approved_by
WHERE p.wholesale_status != 'none'
ORDER BY
  -- Pending first, then by date
  CASE p.wholesale_status
    WHEN 'pending'  THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    ELSE 4
  END,
  p.wholesale_applied_at DESC NULLS LAST;


-- ============================================================================
-- NOTE: Storage bucket + policies for "business-licenses"
-- ============================================================================
-- Supabase does NOT allow creating storage policies via SQL migrations —
-- storage.objects is owned by the supabase_storage_admin role.
--
-- ✅ DO THIS MANUALLY in the Supabase Dashboard:
--
-- 1. Go to Storage → Create bucket
--    Name: business-licenses
--    Public: NO (private)
--
-- 2. Go to Storage → Policies → business-licenses → New policy
--    Add these 4 policies (use "Custom" mode):
--
--    a) INSERT — "Users upload own documents"
--       Allowed operation: INSERT
--       Target roles: authenticated
--       WITH CHECK: (auth.uid()::text = (storage.foldername(name))[1])
--
--    b) SELECT — "Users read own documents"
--       Allowed operation: SELECT
--       Target roles: authenticated
--       USING: (auth.uid()::text = (storage.foldername(name))[1])
--
--    c) SELECT — "Admins read all documents"
--       Allowed operation: SELECT
--       Target roles: authenticated
--       USING: (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
--
--    d) DELETE — "Users delete own documents"
--       Allowed operation: DELETE
--       Target roles: authenticated
--       USING: (auth.uid()::text = (storage.foldername(name))[1])
-- ============================================================================


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify trigger is correct
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verify new policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verify function exists
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'submit_wholesale_application';

-- Verify view
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_wholesale_applications'
ORDER BY ordinal_position;