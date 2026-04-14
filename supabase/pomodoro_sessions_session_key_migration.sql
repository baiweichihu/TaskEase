begin;

alter table if exists public.pomodoro_sessions
  add column if not exists session_key text;

update public.pomodoro_sessions
set session_key = coalesce(session_key, id::text)
where session_key is null or btrim(session_key) = '';

alter table public.pomodoro_sessions
  alter column session_key set not null;

do $$
begin
  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'pomodoro_sessions'
      and indexname = 'idx_pomodoro_sessions_user_session_key'
  ) then
    drop index public.idx_pomodoro_sessions_user_session_key;
  end if;
end
$$;

create unique index if not exists idx_pomodoro_sessions_user_session_key
  on public.pomodoro_sessions(user_id, session_key);

commit;
