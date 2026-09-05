-- Update mood types to support wider variety of moods
-- First, remove the old CHECK constraint on profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_mood_check;

-- Add new CHECK constraint with expanded mood options
ALTER TABLE profiles ADD CONSTRAINT profiles_mood_check
  CHECK (mood IN (
    'joyful', 'content', 'peaceful', 'excited', 'grateful',
    'sad', 'melancholic', 'lonely', 'heartbroken', 'grieving',
    'anxious', 'stressed', 'overwhelmed', 'frustrated', 'angry',
    'hopeful', 'optimistic', 'determined', 'inspired', 'curious',
    'numb', 'confused', 'restless', 'tired', 'apathetic',
    'scared', 'worried', 'nervous', 'vulnerable', 'uncertain'
  ));

-- Remove the old CHECK constraint on diary_entries table
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_mood_check;

-- Add new CHECK constraint with expanded mood options
ALTER TABLE diary_entries ADD CONSTRAINT diary_entries_mood_check
  CHECK (mood IN (
    'joyful', 'content', 'peaceful', 'excited', 'grateful',
    'sad', 'melancholic', 'lonely', 'heartbroken', 'grieving',
    'anxious', 'stressed', 'overwhelmed', 'frustrated', 'angry',
    'hopeful', 'optimistic', 'determined', 'inspired', 'curious',
    'numb', 'confused', 'restless', 'tired', 'apathetic',
    'scared', 'worried', 'nervous', 'vulnerable', 'uncertain'
  ));
