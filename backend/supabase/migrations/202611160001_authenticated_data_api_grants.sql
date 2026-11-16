-- Grant only the table operations currently used by the mobile client.
-- Row-level security remains enabled and limits user-owned rows to auth.uid().
grant usage on schema public to authenticated;
grant select, insert on table public.financial_accounts to authenticated;
grant select, insert on table public.transactions to authenticated;
grant select on table public.categories to authenticated;
