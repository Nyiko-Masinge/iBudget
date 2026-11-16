-- Client CRUD for user-owned plans and goals; transaction deletion is a soft delete.
grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.savings_goals to authenticated;
grant update on table public.transactions to authenticated;
