-- Give both budgets and savings goals an explicit, user-selected time window.
alter table public.budgets drop constraint if exists budgets_period_type_check;
alter table public.budgets add constraint budgets_period_type_check
  check (period_type in ('daily','weekly','monthly','yearly','custom'));

alter table public.savings_goals
  add column if not exists period_type text not null default 'monthly',
  add column if not exists start_date date not null default current_date;

alter table public.savings_goals drop constraint if exists savings_goals_period_type_check;
alter table public.savings_goals add constraint savings_goals_period_type_check
  check (period_type in ('daily','weekly','monthly','yearly','custom'));

-- Backfill legacy goals with the date they were created on, keeping any earlier
-- target date valid for historical goals before enforcing ordered windows.
update public.savings_goals
set start_date = least(created_at::date, target_date)
where target_date is not null and target_date < start_date;

alter table public.savings_goals drop constraint if exists savings_goals_valid_period;
alter table public.savings_goals add constraint savings_goals_valid_period
  check (target_date is null or target_date >= start_date);

create or replace function public.validate_goal_contribution_period()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.savings_goals g
    where g.id = new.goal_id and g.user_id = new.user_id
      and new.contribution_date >= g.start_date
      and (g.target_date is null or new.contribution_date <= g.target_date)
  ) then
    raise exception 'Contribution date must fall within the savings goal period' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists goal_contributions_validate_period on public.goal_contributions;
create trigger goal_contributions_validate_period
  before insert or update
  on public.goal_contributions for each row
  execute function public.validate_goal_contribution_period();

revoke all on function public.validate_goal_contribution_period() from public, anon, authenticated;
