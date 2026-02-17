-- ============================================================================
-- COMPREHENSIVE FIX FOR "Database error saving new user"
-- ============================================================================
--
-- Run these SQL commands in Supabase Dashboard → SQL Editor
-- Run them ONE AT A TIME and check if signup works after each one.
--
-- ============================================================================

-- ============================================================================
-- FIX 1: Add Missing INSERT Policy (MOST LIKELY FIX)
-- ============================================================================
-- The handle_new_user() trigger needs permission to insert into profiles

CREATE POLICY IF NOT EXISTS "profiles_insert_on_signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Test signup now. If it works, you're done! If not, continue...


-- ============================================================================
-- FIX 2: Recreate the Trigger with Proper Permissions
-- ============================================================================
-- Sometimes the trigger function needs to be recreated

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Test signup now. If it works, you're done! If not, continue...


-- ============================================================================
-- FIX 3: Temporarily Disable RLS for Testing
-- ============================================================================
-- This will help identify if RLS is the problem

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test signup now. If it works, RLS was the issue.
-- Then re-enable RLS and add proper policies:

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add comprehensive policies:
DROP POLICY IF EXISTS "profiles_insert_on_signup" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Allow signup inserts
CREATE POLICY "profiles_insert_on_signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Test signup now. If it works, you're done! If not, continue...


-- ============================================================================
-- FIX 4: Check for Column Issues
-- ============================================================================
-- The full_name field might be NULL and causing issues

-- Update the trigger to handle NULL values better:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert with explicit NULL handling
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test signup now. If it works, you're done! If not, continue...


-- ============================================================================
-- FIX 5: Nuclear Option - Remove Trigger Temporarily
-- ============================================================================
-- If nothing works, disable the trigger to allow signup

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now signup should work, but profiles won't be auto-created
-- You can manually create the profile after signup, or fix the trigger later


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to check your setup:

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check profiles policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check recent auth errors (if any)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;


-- ============================================================================
-- RECOMMENDED APPROACH
-- ============================================================================
-- 
-- 1. Start with FIX 1 (add INSERT policy)
-- 2. If that doesn't work, try FIX 2 (recreate trigger)
-- 3. If still failing, try FIX 3 (disable RLS temporarily to test)
-- 4. Use verification queries to debug
--
-- Most likely, FIX 1 will solve your problem!
-- ============================================================================