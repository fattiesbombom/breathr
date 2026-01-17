-- ============================================================================
-- ADD user_icon COLUMN TO PROFILES TABLE
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add the user_icon column
-- to the profiles table if it doesn't already exist

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_icon TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'user_icon';
