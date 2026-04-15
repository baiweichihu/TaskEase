-- Enforce minimum persisted Pomodoro duration of 60 seconds.
-- This script removes historical rows that are shorter than 60 seconds,
-- then adds a check constraint for future writes.

begin;

delete from public.pomodoro_sessions
where duration_seconds < 60;

alter table public.pomodoro_sessions
  drop constraint if exists pomodoro_sessions_duration_min_60_check;

alter table public.pomodoro_sessions
  add constraint pomodoro_sessions_duration_min_60_check
  check (duration_seconds >= 60);

commit;
