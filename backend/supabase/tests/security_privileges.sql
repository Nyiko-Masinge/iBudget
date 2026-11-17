begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

select is(
  (select count(*)::integer
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p')
     and c.relname in (
       'profiles', 'financial_accounts', 'categories', 'transactions', 'budgets',
       'budget_allocations', 'savings_goals', 'goal_contributions', 'user_achievements',
       'financial_snapshots', 'insight_records', 'achievements'
     )
     and c.relrowsecurity),
  12,
  'RLS is enabled on every expected public table'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'profiles', 'financial_accounts', 'categories', 'transactions', 'budgets',
      'budget_allocations', 'savings_goals', 'goal_contributions', 'user_achievements',
      'financial_snapshots', 'insight_records', 'achievements'
    ]) as t(name)
    where has_table_privilege('anon', 'public.' || t.name, 'SELECT')
       or has_table_privilege('anon', 'public.' || t.name, 'INSERT')
       or has_table_privilege('anon', 'public.' || t.name, 'UPDATE')
       or has_table_privilege('anon', 'public.' || t.name, 'DELETE')
       or has_table_privilege('anon', 'public.' || t.name, 'TRUNCATE')
  ),
  'anon has no table privileges on public application tables'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'profiles', 'financial_accounts', 'categories', 'transactions', 'budgets',
      'budget_allocations', 'savings_goals', 'goal_contributions', 'user_achievements',
      'financial_snapshots', 'insight_records', 'achievements'
    ]) as t(name)
    where has_table_privilege('authenticated', 'public.' || t.name, 'TRUNCATE')
       or has_table_privilege('authenticated', 'public.' || t.name, 'REFERENCES')
       or has_table_privilege('authenticated', 'public.' || t.name, 'TRIGGER')
  ),
  'authenticated has no table-wide bypass privileges'
);

select ok(
  not has_schema_privilege('anon', 'public', 'CREATE')
  and not has_schema_privilege('authenticated', 'public', 'CREATE'),
  'API roles cannot create objects in the public schema'
);

select ok(
  not exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) acl
    where d.defaclrole = 'postgres'::regrole
      and d.defaclobjtype = 'f'
      and (d.defaclnamespace = 0::oid or d.defaclnamespace = 'public'::regnamespace)
      and acl.grantee in (
        0::oid,
        'anon'::regrole::oid,
        'authenticated'::regrole::oid,
        'service_role'::regrole::oid
      )
  ),
  'postgres-created functions are not executable by PUBLIC or Data API roles by default'
);

select ok(
  not exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) acl
    where d.defaclrole = 'postgres'::regrole
      and (d.defaclnamespace = 0::oid or d.defaclnamespace = 'public'::regnamespace)
      and d.defaclobjtype in ('r', 'S')
      and acl.grantee in (0::oid, 'anon'::regrole::oid, 'authenticated'::regrole::oid)
  ),
  'postgres-created public tables and sequences are not exposed by default'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE')
        or has_function_privilege('service_role', p.oid, 'EXECUTE')
      )
  ),
  'public functions are not directly executable by API roles'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  and has_table_privilege('authenticated', 'public.profiles', 'INSERT')
  and has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
  'profiles grants only the client operations it needs'
);

select ok(
  has_table_privilege('authenticated', 'public.transactions', 'SELECT')
  and has_table_privilege('authenticated', 'public.transactions', 'INSERT')
  and has_table_privilege('authenticated', 'public.transactions', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.transactions', 'DELETE'),
  'transactions grants support soft deletion without hard deletion'
);

select ok(
  not has_table_privilege('authenticated', 'public.user_achievements', 'INSERT')
  and not has_table_privilege('authenticated', 'public.user_achievements', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.user_achievements', 'DELETE')
  and not has_table_privilege('authenticated', 'public.financial_snapshots', 'SELECT')
  and not has_table_privilege('authenticated', 'public.insight_records', 'SELECT')
  and not has_table_privilege('authenticated', 'public.achievements', 'INSERT')
  and not has_table_privilege('authenticated', 'public.achievements', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.achievements', 'DELETE'),
  'derived records and the achievement catalogue remain server-controlled'
);

select * from finish();
rollback;
