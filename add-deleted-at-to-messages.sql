-- Add deleted_at and edited_at columns to messages table
-- Run this in Supabase SQL Editor

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);
