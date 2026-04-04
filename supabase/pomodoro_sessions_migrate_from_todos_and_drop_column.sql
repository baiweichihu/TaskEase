-- Migrate legacy aggregate pomodoro data from todos into pomodoro_sessions,
-- then remove todos.pomodoro_total_seconds.
-- Idempotent: safe to run once; subsequent runs will no-op after the column is dropped.

begin;

-- Ensure session table exists (if already created, this is a no-op).
create table if not exists public.pomodoro_sessions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.todos(id) on delete set null,
  task_title text,
  duration_seconds bigint not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create index if not exists idx_pomodoro_sessions_user_id on public.pomodoro_sessions(user_id);
create index if not exists idx_pomodoro_sessions_created_at on public.pomodoro_sessions(created_at);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'pomodoro_total_seconds'
  ) then
    insert into public.pomodoro_sessions (
      user_id,
      task_id,
      task_title,
      duration_seconds,
      start_time,
      end_time,
      created_at,
      updated_at
    )
    select
      t.user_id,
      t.id as task_id,
      nullif(btrim(t.title), '') as task_title,
      greatest(0, coalesce(t.pomodoro_total_seconds, 0))::bigint as duration_seconds,
      (now() - (interval '1 second' * greatest(0, coalesce(t.pomodoro_total_seconds, 0)))) as start_time,
      now() as end_time,
      now() as created_at,
      now() as updated_at
    from public.todos t
    where coalesce(t.pomodoro_total_seconds, 0) > 0
      and not exists (
        select 1
        from public.pomodoro_sessions s
        where s.user_id = t.user_id
          and s.task_id = t.id
      );

    alter table public.todos drop column if exists pomodoro_total_seconds;
  end if;
end
$$;

commit;
