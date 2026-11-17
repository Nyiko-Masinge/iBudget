-- Start from no Data API privileges and grant only the operations the client uses.
-- RLS policies remain the row-level authorization boundary for authenticated users.
-- Supabase services rely on PUBLIC schema usage; remove object creation only.
revoke create on schema public from public, anon, authenticated, service_role;
grant usage on schema public to public, service_role;

revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;
revoke all privileges on all functions in schema public from public, anon, authenticated, service_role;

-- Supabase projects can grant broad rights to newly created public objects by default.
-- Make future migrations fail closed too (migrations run as postgres in Supabase).
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
-- PostgreSQL grants EXECUTE to PUBLIC globally; a schema-scoped revoke cannot cancel it.
alter default privileges for role postgres
  revoke execute on functions from public;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.financial_accounts to authenticated;
grant select on table public.categories to authenticated;
grant select, insert, update on table public.transactions to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.savings_goals to authenticated;
grant select, insert on table public.goal_contributions to authenticated;
grant select on table public.user_achievements, public.achievements to authenticated;

-- Keep RLS enabled for every client-facing table, including tables with no client grants.
alter table public.profiles enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.savings_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.financial_snapshots enable row level security;
alter table public.insight_records enable row level security;
alter table public.achievements enable row level security;
