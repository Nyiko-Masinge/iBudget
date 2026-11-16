-- Enable the mobile features while keeping ownership checks enforced by RLS.
grant select, insert on table public.budgets to authenticated;
grant select, insert on table public.goal_contributions to authenticated;
grant select, insert on table public.savings_goals to authenticated;
grant select on table public.user_achievements, public.achievements to authenticated;

-- These awards are emitted inside the database from persisted ledger activity.
insert into public.achievements(code,name,description,category,icon,rarity)
values
 ('first_transaction','First step','Recorded your first transaction.','tracking','✦','common'),
 ('ten_transactions','Finding a rhythm','Recorded ten transactions.','tracking','✧','uncommon')
on conflict (code) do nothing;

create or replace function public.award_ledger_milestones()
returns trigger language plpgsql security definer set search_path = '' as $$
declare total_count bigint;
begin
 select count(*) into total_count from public.transactions t
 where t.user_id = new.user_id and t.deleted_at is null;
 insert into public.user_achievements(user_id,achievement_id,earned_at,progress_value,target_value)
 select new.user_id,a.id,now(),total_count,m.target_value
 from (values ('first_transaction',1::bigint),('ten_transactions',10::bigint)) as m(code,target_value)
 join public.achievements a on a.code=m.code and a.is_active
 where total_count >= m.target_value
 on conflict (user_id,achievement_id) do update
 set earned_at = coalesce(user_achievements.earned_at,excluded.earned_at),
     progress_value = greatest(user_achievements.progress_value,excluded.progress_value);
 return new;
end $$;
create trigger transactions_award_milestones after insert on public.transactions
for each row execute function public.award_ledger_milestones();
revoke all on function public.award_ledger_milestones() from public, anon, authenticated;
