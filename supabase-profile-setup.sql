-- Profile System Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (char_length(status) <= 100),
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_discord TEXT,
  ADD COLUMN IF NOT EXISTS contact_twitter TEXT,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  ADD COLUMN IF NOT EXISTS love_letters_posted INTEGER DEFAULT 0 CHECK (love_letters_posted >= 0);

-- 2. Create profile_likes table
CREATE TABLE IF NOT EXISTS profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, user_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_likes_profile_id ON profile_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_likes_user_id ON profile_likes(user_id);

-- 4. Enable Row Level Security
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profile_likes
CREATE POLICY "Anyone can view profile likes"
  ON profile_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like profiles"
  ON profile_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike profiles"
  ON profile_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create RPC function to increment profile likes
CREATE OR REPLACE FUNCTION increment_profile_likes(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET likes = likes + 1
  WHERE id = profile_id;
END;
$$;

-- 7. Create RPC function to decrement profile likes
CREATE OR REPLACE FUNCTION decrement_profile_likes(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET likes = GREATEST(0, likes - 1)
  WHERE id = profile_id;
END;
$$;

-- 8. Update profiles RLS policy to allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 9. Create storage bucket for profile media (run in Supabase Storage UI or via Dashboard)
-- Go to Storage > Create a new bucket called "profile-media"
-- Set it to Public
-- Then run this to set up RLS policies:

-- Storage policies for profile-media bucket
CREATE POLICY "Anyone can view profile media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

CREATE POLICY "Users can upload their own profile media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
