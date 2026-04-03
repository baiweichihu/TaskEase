-- Adds explicit Pomodoro tracked time column.
-- IMPORTANT: Use this instead of storing timer data inside remark markers.

alter table public.todos
  add column if not exists pomodoro_total_seconds integer not null default 0;

alter table public.todos
  drop constraint if exists todos_pomodoro_total_seconds_check;

alter table public.todos
  add constraint todos_pomodoro_total_seconds_check
  check (pomodoro_total_seconds >= 0);

comment on column public.todos.pomodoro_total_seconds is 'Accumulated tracked seconds from Pomodoro timer';
