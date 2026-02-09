-- Craft bucket storage policies - Copy this entire file and run in Supabase SQL Editor
-- Do NOT run CRAFT_BUCKET_SETUP.md (that's markdown, not SQL)

CREATE POLICY "Craft public read" ON storage.objects
FOR SELECT
USING (bucket_id = 'craft');

CREATE POLICY "Craft admin upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

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

CREATE POLICY "Craft admin delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'craft' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
