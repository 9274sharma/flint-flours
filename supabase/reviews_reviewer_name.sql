-- Run this in Supabase SQL Editor
-- Add reviewer_name column to reviews

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
