-- Add task progress (0–100, step 10) and per-user saved labels in preferences.
-- Run in Supabase SQL editor (safe to run once; uses IF NOT EXISTS).

alter table public.user_preferences
  add column if not exists task_labels jsonb not null default '[]'::jsonb;

alter table public.todos
  add column if not exists progress_percent smallint not null default 0;

alter table public.todos
  drop constraint if exists todos_progress_percent_check;

alter table public.todos
  add constraint todos_progress_percent_check
  check (
    progress_percent >= 0
    and progress_percent <= 100
    and mod(progress_percent, 10) = 0
  );

comment on column public.todos.progress_percent is 'Completion 0–100 in steps of 10';
comment on column public.user_preferences.task_labels is 'JSON array of label strings for the task form';
