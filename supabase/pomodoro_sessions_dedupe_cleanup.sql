-- One-time cleanup for obvious duplicate pomodoro sessions that were created by sync/retry issues.
-- Keeps the earliest row in each duplicate group.

begin;

with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        task_id,
        duration_seconds,
        date_trunc('minute', created_at)
      order by created_at asc, updated_at asc, id asc
    ) as rn
  from public.pomodoro_sessions
)
delete from public.pomodoro_sessions p
using ranked r
where p.id = r.id
  and r.rn > 1;

commit;
