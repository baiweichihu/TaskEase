-- Optional: persist UI theme preset and custom background per user account.
-- Run in Supabase SQL Editor before enabling account-level migration of these fields.

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS theme_preset text,
ADD COLUMN IF NOT EXISTS custom_background text;

COMMENT ON COLUMN public.user_preferences.theme_preset
IS 'Theme preset key (beige/pink/blue/lavender/custom-bg).';

COMMENT ON COLUMN public.user_preferences.custom_background
IS 'Custom background image data URL or URL.';
