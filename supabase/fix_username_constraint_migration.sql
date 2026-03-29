-- Fix username constraint to align with frontend validation
-- Run this SQL in Supabase SQL Editor to fix the username update timeout issue

-- First, drop the old constraint if it exists
DO $$ 
BEGIN
    -- Drop the old regex constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_username_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_check;
    END IF;
    
    -- Add the new length-based constraint
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_username_check 
    CHECK (char_length(username) >= 1 AND char_length(username) <= 15);
    
EXCEPTION
    WHEN others THEN
        -- If there's an error, just continue (constraint might already be correct)
        NULL;
END $$;