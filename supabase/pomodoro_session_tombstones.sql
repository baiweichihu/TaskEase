-- Tombstone table for Pomodoro session deletions.
-- This allows clients to distinguish "deleted" from "not yet synced" and prevents record resurrection across devices.
-- Run in Supabase SQL editor.

create table if not exists public.pomodoro_session_tombstones (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id bigint not null,
  deleted_at timestamptz not null default now(),
  reason text,
  unique (user_id, session_id)
);

create index if not exists idx_pomodoro_session_tombstones_user_id on public.pomodoro_session_tombstones(user_id);
create index if not exists idx_pomodoro_session_tombstones_user_session on public.pomodoro_session_tombstones(user_id, session_id);
create index if not exists idx_pomodoro_session_tombstones_deleted_at on public.pomodoro_session_tombstones(deleted_at desc);

alter table public.pomodoro_session_tombstones enable row level security;

drop policy if exists "Users can view their own pomodoro tombstones" on public.pomodoro_session_tombstones;
create policy "Users can view their own pomodoro tombstones"
  on public.pomodoro_session_tombstones for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own pomodoro tombstones" on public.pomodoro_session_tombstones;
create policy "Users can create their own pomodoro tombstones"
  on public.pomodoro_session_tombstones for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own pomodoro tombstones" on public.pomodoro_session_tombstones;
create policy "Users can update their own pomodoro tombstones"
  on public.pomodoro_session_tombstones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own pomodoro tombstones" on public.pomodoro_session_tombstones;
create policy "Users can delete their own pomodoro tombstones"
  on public.pomodoro_session_tombstones for delete
  using (auth.uid() = user_id);

comment on table public.pomodoro_session_tombstones is 'Deletion markers for Pomodoro sessions';
comment on column public.pomodoro_session_tombstones.session_id is 'Deleted pomodoro_sessions.id value';
