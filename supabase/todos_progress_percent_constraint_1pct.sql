-- Relax todos.progress_percent constraint to allow 1% precision (0-100 integer).
-- This migration is database-only and does not require frontend code changes.
-- Run in Supabase SQL editor.

alter table public.todos
  drop constraint if exists todos_progress_percent_check;

alter table public.todos
  add constraint todos_progress_percent_check
  check (
    progress_percent >= 0
    and progress_percent <= 100
  );

comment on column public.todos.progress_percent is 'Completion 0-100 with 1% precision (integer)';

-- Optional verification:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conname = 'todos_progress_percent_check';
