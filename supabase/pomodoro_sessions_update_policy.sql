-- Allow users to update their own pomodoro_sessions rows.
-- Run in Supabase SQL editor.

alter table public.pomodoro_sessions enable row level security;

drop policy if exists "Users can update their own pomodoro sessions" on public.pomodoro_sessions;
create policy "Users can update their own pomodoro sessions"
  on public.pomodoro_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
