-- Update username constraint to support any characters with max length 15.
-- Run this SQL in Supabase SQL Editor.

alter table if exists public.profiles
  drop constraint if exists profiles_username_check;

alter table if exists public.profiles
  add constraint profiles_username_check
  check (char_length(username) >= 1 and char_length(username) <= 15);
