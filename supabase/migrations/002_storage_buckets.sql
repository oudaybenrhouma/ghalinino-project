-- ============================================================================
-- SUPABASE STORAGE BUCKETS
-- Ghalinino - Tunisia E-commerce
-- ============================================================================
--
-- This migration creates storage buckets for:
-- 1. business-licenses: Wholesale application documents
-- 2. products: Product images
-- 3. avatars: User profile pictures
--
-- RUN THIS IN: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- SECTION 1: CREATE STORAGE BUCKETS
-- ============================================================================

-- Note: Storage buckets are typically created via the Supabase Dashboard
-- or using the Supabase CLI. This SQL provides the RLS policies.

-- To create buckets via Dashboard:
-- 1. Go to Storage in the sidebar
-- 2. Click "New bucket"
-- 3. Create these buckets:
--    - business-licenses (private)
--    - products (public)
--    - avatars (public)


-- ============================================================================
-- SECTION 2: RLS POLICIES FOR STORAGE.OBJECTS
-- ============================================================================

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This is usually enabled by default in Supabase

-- ============================================================================
-- BUSINESS LICENSES BUCKET
-- ============================================================================
-- Users can upload to their own folder only
-- Users can read their own files
-- Admins can read all files

-- Policy: Users can upload business licenses to their own folder
CREATE POLICY "business_licenses_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own business licenses
CREATE POLICY "business_licenses_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can read all business licenses
CREATE POLICY "business_licenses_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can delete their own business licenses
CREATE POLICY "business_licenses_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- PRODUCTS BUCKET
-- ============================================================================
-- Public read access
-- Admin-only write access

-- Policy: Anyone can view product images
CREATE POLICY "products_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy: Admins can upload product images
CREATE POLICY "products_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can update product images
CREATE POLICY "products_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can delete product images
CREATE POLICY "products_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);


-- ============================================================================
-- AVATARS BUCKET
-- ============================================================================
-- Public read access
-- Users can upload/update/delete their own avatar

-- Policy: Anyone can view avatars
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatar
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- SECTION 3: VERIFICATION QUERIES
-- ============================================================================

-- List all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
