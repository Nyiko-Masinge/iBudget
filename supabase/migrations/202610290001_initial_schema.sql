create extension if not exists pgcrypto;
create type public.transaction_type as enum ('income','expense','transfer','refund');
create type public.account_type as enum ('cash','checking','savings','credit');
create type public.category_type as enum ('income','expense','transfer');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text check (char_length(display_name) <= 100),
 preferred_currency char(3) not null default 'ZAR',
 pay_frequency text,
 timezone text not null default 'Africa/Johannesburg',
 onboarding_completed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.financial_accounts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 100), account_type public.account_type not null,
 currency char(3) not null default 'ZAR', opening_balance_minor bigint not null default 0,
 is_archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 name text not null, category_type public.category_type not null, icon text, color text,
 is_system boolean not null default false, created_at timestamptz not null default now(),
 check ((is_system and user_id is null) or (not is_system and user_id is not null))
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 account_id uuid not null, category_id uuid, transaction_type public.transaction_type not null,
 amount_minor bigint not null check (amount_minor > 0), currency char(3) not null default 'ZAR',
 description text not null check (char_length(description) between 1 and 240), merchant text,
 occurred_at timestamptz not null, is_recurring boolean not null default false, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 foreign key(account_id,user_id) references public.financial_accounts(id,user_id) on delete restrict,
 foreign key(category_id) references public.categories(id) on delete set null
);
create index transactions_user_date_idx on public.transactions(user_id, occurred_at desc) where deleted_at is null;
create table public.budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, period_type text not null check (period_type in ('weekly','monthly','custom')),
 start_date date not null, end_date date not null, currency char(3) not null default 'ZAR',
 total_limit_minor bigint not null check (total_limit_minor >= 0), status text not null default 'active' check (status in ('active','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date >= start_date), unique(id,user_id)
);
create table public.budget_allocations (
 id uuid primary key default gen_random_uuid(), budget_id uuid not null, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 category_id uuid not null references public.categories(id) on delete restrict, allocated_amount_minor bigint not null check (allocated_amount_minor >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(budget_id,user_id) references public.budgets(id,user_id) on delete cascade, unique(budget_id,category_id)
);
create table public.savings_goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, description text, target_amount_minor bigint not null check (target_amount_minor > 0), currency char(3) not null default 'ZAR',
 target_date date, icon text, status text not null default 'active' check (status in ('active','completed','paused','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.goal_contributions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 goal_id uuid not null, amount_minor bigint not null check (amount_minor > 0), contribution_date date not null default current_date,
 source_type text not null default 'manual', linked_transaction_id uuid references public.transactions(id) on delete set null,
 notes text, created_at timestamptz not null default now(), foreign key(goal_id,user_id) references public.savings_goals(id,user_id) on delete cascade
);
create table public.achievements (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text not null,
 category text not null, icon text, rarity text not null default 'common', criteria_version integer not null default 1, is_active boolean not null default true
);
create table public.user_achievements (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 achievement_id uuid not null references public.achievements(id) on delete restrict, earned_at timestamptz,
 progress_value bigint not null default 0, target_value bigint not null default 1, evaluation_version integer not null default 1,
 unique(user_id,achievement_id)
);
create table public.financial_snapshots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 snapshot_date date not null, currency char(3) not null, available_balance_minor bigint, income_minor bigint, expense_minor bigint,
 created_at timestamptz not null default now(), unique(user_id,snapshot_date,currency)
);
create table public.insight_records (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 insight_type text not null, title text not null, explanation text not null, supporting_period daterange,
 confidence numeric(4,3) check (confidence between 0 and 1), generated_at timestamptz not null default now(), expires_at timestamptz,
 status text not null default 'active'
);

-- Every per-user table is isolated by RLS. Identity is immutable; achievement awards are service generated.
alter table public.profiles enable row level security;
create policy profiles_read_own on public.profiles for select to authenticated using (id=auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id=auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
do $$ declare t text; begin
 foreach t in array array['financial_accounts','categories','transactions','budgets','budget_allocations','savings_goals','goal_contributions','user_achievements','financial_snapshots','insight_records'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())',t||'_read_own',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())',t||'_insert_own',t);
  execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',t||'_update_own',t);
  execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())',t||'_delete_own',t);
 end loop;
end $$;
alter table public.achievements enable row level security;
create policy achievements_catalog_read on public.achievements for select to authenticated using (is_active);
revoke insert,update,delete on public.achievements from anon,authenticated;
-- Users can read their own awards, but only a trusted server process may write them.
drop policy if exists user_achievements_insert_own on public.user_achievements;
drop policy if exists user_achievements_update_own on public.user_achievements;
drop policy if exists user_achievements_delete_own on public.user_achievements;
create policy user_achievements_read_own on public.user_achievements for select to authenticated using (user_id=auth.uid());
-- Shared category catalogue rows are readable; writes remain owner-scoped.
create policy categories_read_system_or_own on public.categories for select to authenticated using (is_system or user_id=auth.uid());

-- Enforce that referenced categories and contribution transactions belong to the same user.
create or replace function public.validate_transaction_references()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if not exists (select 1 from public.financial_accounts a where a.id=new.account_id and a.user_id=new.user_id) then
  raise exception 'Account must belong to transaction owner' using errcode='23503';
 end if;
 if new.category_id is not null and not exists (select 1 from public.categories c where c.id=new.category_id and (c.user_id=new.user_id or c.is_system)) then
  raise exception 'Category must be shared or belong to transaction owner' using errcode='23503';
 end if;
 return new;
end $$;
create trigger transactions_validate_references before insert or update of user_id,account_id,category_id on public.transactions for each row execute function public.validate_transaction_references();
create or replace function public.validate_allocation_references()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.categories c where c.id=new.category_id and (c.user_id=new.user_id or c.is_system) and c.category_type='expense') then
  raise exception 'Allocation category must be an expense category available to owner' using errcode='23503';
 end if;
 return new;
end $$;
create trigger allocations_validate_category before insert or update of user_id,budget_id,category_id on public.budget_allocations for each row execute function public.validate_allocation_references();
create or replace function public.validate_contribution_transaction()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.linked_transaction_id is not null and not exists(select 1 from public.transactions t where t.id=new.linked_transaction_id and t.user_id=new.user_id and t.deleted_at is null) then
  raise exception 'Linked transaction must belong to contribution owner' using errcode='23503';
 end if;
 return new;
end $$;
create trigger contributions_validate_transaction before insert or update of user_id,goal_id,linked_transaction_id on public.goal_contributions for each row execute function public.validate_contribution_transaction();

-- Development catalogue rows only; they contain no user data.
insert into public.categories(name,category_type,icon,color,is_system) values
 ('Salary','income','briefcase','#197B58',true),
 ('Other income','income','add-circle','#197B58',true),
 ('Housing','expense','home','#D49A28',true),
 ('Food','expense','restaurant','#D49A28',true),
 ('Transport','expense','car','#D49A28',true),
 ('Utilities','expense','flash','#D49A28',true),
 ('Health','expense','heart','#D49A28',true),
 ('Personal','expense','person','#D49A28',true),
 ('Transfer','transfer','swap-horizontal','#627169',true)
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name) values (new.id, nullif(new.raw_user_meta_data->>'display_name',''));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();



