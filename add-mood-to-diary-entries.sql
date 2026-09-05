-- Add mood fields to diary_entries table
-- This allows each entry to have its own mood color displayed in the calendar

ALTER TABLE diary_entries
ADD COLUMN mood TEXT CHECK (mood IN ('happy', 'sad', 'struggling', 'hopeful')),
ADD COLUMN mood_color TEXT,
ADD COLUMN mood_confidence DECIMAL(3,2) CHECK (mood_confidence >= 0 AND mood_confidence <= 1);

-- Add index for mood queries
CREATE INDEX idx_diary_entries_mood ON diary_entries(mood) WHERE mood IS NOT NULL;
