-- Add explicit recurrence columns and migrate legacy remark markers.
-- Safe to run once (uses IF NOT EXISTS and idempotent updates).

alter table public.todos
  add column if not exists repeat_rule text not null default 'none';

alter table public.todos
  add column if not exists repeat_until_date date;

alter table public.todos
  drop constraint if exists todos_repeat_rule_check;

alter table public.todos
  add constraint todos_repeat_rule_check
  check (repeat_rule in ('none', 'daily', 'weekly', 'monthly'));

-- Backfill repeat_rule from legacy marker when present.
update public.todos
set repeat_rule = (regexp_match(remark, E'\\[repeat:(none|daily|weekly|monthly)\\]'))[1]
where remark is not null
  and remark ~* E'\\[repeat:(none|daily|weekly|monthly)\\]';

-- Backfill repeat_until_date from legacy marker when present.
update public.todos
set repeat_until_date = ((regexp_match(remark, E'\\[repeat-until:([0-9]{4}-[0-9]{2}-[0-9]{2})\\]'))[1])::date
where remark is not null
  and remark ~* E'\\[repeat-until:[0-9]{4}-[0-9]{2}-[0-9]{2}\\]'
  and repeat_until_date is null;

-- Clean migrated markers from remark text.
update public.todos
set remark = nullif(
  btrim(
    regexp_replace(
      regexp_replace(remark, E'\\[repeat:(none|daily|weekly|monthly)\\]', '', 'gi'),
      E'\\[repeat-until:[0-9]{4}-[0-9]{2}-[0-9]{2}\\]',
      '',
      'gi'
    )
  ),
  ''
)
where remark is not null
  and (
    remark ~* E'\\[repeat:(none|daily|weekly|monthly)\\]'
    or remark ~* E'\\[repeat-until:[0-9]{4}-[0-9]{2}-[0-9]{2}\\]'
  );

comment on column public.todos.repeat_rule is 'Task recurrence rule: none/daily/weekly/monthly';
comment on column public.todos.repeat_until_date is 'Recurrence end date (inclusive)';
