-- Migration: 004_storage_rls_policies.sql
-- Date: 2026-02-09
-- Description: Create RLS policies for storage.objects (products bucket)
-- 
-- This fixes the "new row violates row-level security policy" error when uploading images

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This is usually enabled by default, but we'll ensure it

-- Policy 1: Public read access (anyone can view images)
-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Policy 2: Admin upload only (only admins can upload)
-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Admin upload only" ON storage.objects;

CREATE POLICY "Admin upload only" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 3: Admin update (only admins can modify files)
-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Admin update files" ON storage.objects;

CREATE POLICY "Admin update files" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Admin delete (only admins can delete files)
-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Admin delete files" ON storage.objects;

CREATE POLICY "Admin delete files" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
