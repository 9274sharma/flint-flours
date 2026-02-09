-- Migration: 010_craft_storage_policies.sql
-- Description: RLS policies for craft bucket (Our Craft gallery images)
-- Bucket must be created in Supabase Dashboard first: name "craft", public

-- Policy 1: Public read access (anyone can view craft images)
CREATE POLICY "Craft public read" ON storage.objects
FOR SELECT
USING (bucket_id = 'craft');

-- Policy 2: Admin upload only (only admins can upload)
CREATE POLICY "Craft admin upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 3: Admin update (only admins can modify files)
CREATE POLICY "Craft admin update" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Admin delete (only admins can delete files)
CREATE POLICY "Craft admin delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
