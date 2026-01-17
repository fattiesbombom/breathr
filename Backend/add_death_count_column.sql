-- ============================================================================
-- ADD death_count COLUMN TO profiles TABLE
-- ============================================================================
-- Run this script in your Supabase SQL Editor to add the death_count column
-- if it doesn't already exist

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS death_count INTEGER DEFAULT 0;

-- Update any existing rows to have death_count = 0 if they're NULL
UPDATE public.profiles 
SET death_count = 0 
WHERE death_count IS NULL;

-- Make sure the column has a NOT NULL constraint (with default)
ALTER TABLE public.profiles 
ALTER COLUMN death_count SET DEFAULT 0;

-- Optional: Add an index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_death_count ON public.profiles(death_count DESC);
