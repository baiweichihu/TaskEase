-- Drop deprecated task_title column from pomodoro_sessions.
-- Safe to run after frontend no longer depends on this column.

begin;

alter table public.pomodoro_sessions
  drop column if exists task_title;

commit;
