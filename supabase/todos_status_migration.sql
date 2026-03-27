-- Migrate todos schema: completed -> status, and add new task planning fields
-- Safe to run multiple times in Supabase SQL Editor

create extension if not exists pgcrypto;

-- 1) Add status field (English domain values)
alter table public.todos
add column if not exists status text;

-- 2) Backfill status from old completed boolean when possible
update public.todos
set status = case
  when completed is true then 'done'
  else 'pending'
end
where status is null;

-- 3) Default and check constraint for status
alter table public.todos
alter column status set default 'pending';

alter table public.todos
alter column status set not null;

alter table public.todos
drop constraint if exists todos_status_check;

alter table public.todos
add constraint todos_status_check
check (status in ('pending', 'in_progress', 'done', 'blocked', 'cancelled'));

-- 4) Add additional columns
alter table public.todos
add column if not exists remark text null,
add column if not exists ddl timestamptz null,
add column if not exists estimated_hours numeric(6,1) not null default 0,
add column if not exists priority smallint not null default 0,
add column if not exists label text null;

-- 5) Column constraints for numeric ranges
alter table public.todos
drop constraint if exists todos_estimated_hours_check;

alter table public.todos
add constraint todos_estimated_hours_check
check (estimated_hours >= 0 and estimated_hours <= 999.9);

alter table public.todos
drop constraint if exists todos_priority_check;

alter table public.todos
add constraint todos_priority_check
check (priority >= 0 and priority <= 10);

-- 6) Optional index helpers
create index if not exists todos_status_idx on public.todos(status);
create index if not exists todos_ddl_idx on public.todos(ddl);
create index if not exists todos_priority_idx on public.todos(priority);

-- Note:
-- Old column `completed` is intentionally kept for compatibility.
-- After frontend fully migrates and data is validated, you may drop it:
-- alter table public.todos drop column completed;
