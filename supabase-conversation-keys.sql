-- Create conversation_keys table for shared message encryption
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS conversation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_conversation_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, other_user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversation_keys_user_id ON conversation_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_keys_other_user_id ON conversation_keys(other_user_id);

-- RLS policies
ALTER TABLE conversation_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversation keys" ON conversation_keys;
CREATE POLICY "Users can view their own conversation keys"
  ON conversation_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversation keys" ON conversation_keys;
CREATE POLICY "Users can insert their own conversation keys"
  ON conversation_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);
