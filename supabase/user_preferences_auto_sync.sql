-- Add auto sync preference to user_preferences
-- Run this in Supabase SQL Editor.

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_preferences.auto_sync_enabled
IS 'Whether the user enables periodic auto sync every 5 minutes.';
