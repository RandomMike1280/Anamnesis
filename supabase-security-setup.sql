-- Envelope Encryption & Security Features Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Add encrypted_dek column to profiles (stores DEK encrypted with user's PIN)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS encrypted_dek TEXT;

-- 2. Add entry_count column for star size scaling
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS entry_count INTEGER DEFAULT 0 CHECK (entry_count >= 0);

-- 3. Add TOTP secret column for authenticator app support
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;

-- 4. Create function to increment entry count
CREATE OR REPLACE FUNCTION increment_entry_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET entry_count = entry_count + 1
  WHERE id = user_id;
END;
$$;

-- 5. Create function to decrement entry count
CREATE OR REPLACE FUNCTION decrement_entry_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET entry_count = GREATEST(0, entry_count - 1)
  WHERE id = user_id;
END;
$$;

-- 6. Create trigger to auto-increment entry_count on diary_entries insert
CREATE OR REPLACE FUNCTION on_diary_entry_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET entry_count = entry_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS diary_entry_created_trigger ON diary_entries;
CREATE TRIGGER diary_entry_created_trigger
  AFTER INSERT ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION on_diary_entry_created();

-- 7. Create trigger to auto-decrement entry_count on diary_entries delete
CREATE OR REPLACE FUNCTION on_diary_entry_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET entry_count = GREATEST(0, entry_count - 1)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS diary_entry_deleted_trigger ON diary_entries;
CREATE TRIGGER diary_entry_deleted_trigger
  AFTER DELETE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION on_diary_entry_deleted();

-- 8. Backfill entry_count for existing users
UPDATE profiles
SET entry_count = (
  SELECT COUNT(*)
  FROM diary_entries
  WHERE diary_entries.user_id = profiles.id
)
WHERE entry_count = 0;
