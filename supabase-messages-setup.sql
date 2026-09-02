-- Messages Table Enhancement
-- Run this SQL in your Supabase SQL Editor

-- Add columns for media, editing, and soft delete
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'file')),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);

-- Create storage bucket for message media (run in Supabase Storage UI or via Dashboard)
-- Go to Storage > Create a new bucket called "message-media"
-- Set it to Public
-- Then run this to set up RLS policies:

-- Storage policies for message-media bucket
CREATE POLICY "Anyone can view message media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-media');

CREATE POLICY "Authenticated users can upload message media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-media' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their uploaded message media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-media' AND
    auth.role() = 'authenticated'
  );
