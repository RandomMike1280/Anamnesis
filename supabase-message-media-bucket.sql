-- Message Media Storage Bucket Setup
-- Run this SQL in your Supabase SQL Editor after creating the bucket

-- First, manually create the bucket in Supabase Dashboard:
-- 1. Go to Storage → New bucket
-- 2. Name: message-media
-- 3. Check "Public bucket"
-- 4. Click "Create bucket"

-- Then run these policies:

DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message media" ON storage.objects;

CREATE POLICY "Anyone can view message media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-media');

CREATE POLICY "Users can upload their own message media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own message media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
