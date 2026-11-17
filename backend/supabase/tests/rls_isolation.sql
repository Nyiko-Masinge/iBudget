begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'rls-one@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'rls-two@example.invalid');

insert into public.financial_accounts (id, user_id, name, account_type, currency) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'One account', 'cash', 'ZAR'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', 'Two account', 'cash', 'ZAR');
insert into public.categories (id, user_id, name, category_type) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '11111111-1111-4111-8111-111111111111', 'One category', 'expense'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '22222222-2222-4222-8222-222222222222', 'Two category', 'expense');
insert into public.transactions (id, user_id, account_id, category_id, transaction_type, amount_minor, currency, description, occurred_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'expense', 100, 'ZAR', 'One transaction', now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'expense', 200, 'ZAR', 'Two transaction', now());
insert into public.budgets (id, user_id, name, period_type, start_date, end_date, currency, total_limit_minor) values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', '11111111-1111-4111-8111-111111111111', 'One budget', 'monthly', current_date, current_date, 'ZAR', 1000),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', '22222222-2222-4222-8222-222222222222', 'Two budget', 'monthly', current_date, current_date, 'ZAR', 2000);
insert into public.budget_allocations (id, user_id, budget_id, category_id, allocated_amount_minor) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', '11111111-1111-4111-8111-111111111111', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 500),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', '22222222-2222-4222-8222-222222222222', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 700);
insert into public.savings_goals (id, user_id, name, target_amount_minor, currency) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', '11111111-1111-4111-8111-111111111111', 'One goal', 10000, 'ZAR'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', '22222222-2222-4222-8222-222222222222', 'Two goal', 20000, 'ZAR');
insert into public.goal_contributions (id, user_id, goal_id, amount_minor) values
  ('99999999-9999-4999-8999-999999999991', '11111111-1111-4111-8111-111111111111', 'ffffffff-ffff-4fff-8fff-fffffffffff1', 100),
  ('99999999-9999-4999-8999-999999999992', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-fffffffffff2', 200);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select ok((select count(*) = 1 from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 'user one can read their profile');
select ok((select count(*) = 0 from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'user one cannot read user two profile');
select ok((select count(*) = 1 from public.financial_accounts where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'user one can read their account');
select ok((select count(*) = 0 from public.financial_accounts where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'), 'user one cannot read user two account');
select ok((select count(*) = 1 from public.categories where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'), 'user one can read their category');
select ok((select count(*) = 0 from public.categories where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'), 'user one cannot read user two category');
select ok((select count(*) = 1 from public.transactions where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'), 'user one can read their transaction');
select ok((select count(*) = 0 from public.transactions where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'), 'user one cannot read user two transaction');
select ok((select count(*) = 1 from public.budgets where id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'), 'user one can read their budget');
select ok((select count(*) = 0 from public.budgets where id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'), 'user one cannot read user two budget');
select ok((select count(*) = 1 from public.budget_allocations where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'), 'user one can read their allocation');
select ok((select count(*) = 0 from public.budget_allocations where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'), 'user one cannot read user two allocation');
select ok((select count(*) = 1 from public.savings_goals where id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'), 'user one can read their goal');
select ok((select count(*) = 0 from public.savings_goals where id = 'ffffffff-ffff-4fff-8fff-fffffffffff2'), 'user one cannot read user two goal');
select ok((select count(*) = 1 from public.goal_contributions where id = '99999999-9999-4999-8999-999999999991'), 'user one can read their contribution');
select ok((select count(*) = 0 from public.goal_contributions where id = '99999999-9999-4999-8999-999999999992'), 'user one cannot read user two contribution');
select ok((select count(*) > 0 from public.user_achievements where user_id = '11111111-1111-4111-8111-111111111111'), 'user one can read their awards');
select ok((select count(*) = 0 from public.user_achievements where user_id = '22222222-2222-4222-8222-222222222222'), 'user one cannot read user two awards');

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select is_empty($$update public.profiles set display_name = 'changed' where id = '11111111-1111-4111-8111-111111111111' returning id$$, 'user two cannot update user one profile');
select throws_ok(
  $$insert into public.financial_accounts (id, user_id, name, account_type, currency)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '11111111-1111-4111-8111-111111111111', 'forged account', 'cash', 'ZAR') returning id$$,
  '42501', null, 'user two cannot insert an account owned by user one'
);
select throws_ok(
  $$insert into public.transactions (id, user_id, account_id, category_id, transaction_type, amount_minor, currency, description, occurred_at)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'expense', 100, 'ZAR', 'forged category', now()) returning id$$,
  '23503', null, 'user two cannot attach user one category to a transaction'
);
select throws_ok(
  $$insert into public.goal_contributions (id, user_id, goal_id, amount_minor, linked_transaction_id)
    values ('99999999-9999-4999-8999-999999999993', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-fffffffffff2', 100, 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1') returning id$$,
  '23503', null, 'user two cannot link user one transaction to a contribution'
);
select is_empty($$update public.transactions set description = 'changed' where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1' returning id$$, 'user two cannot update user one transaction');
select is_empty($$update public.budgets set name = 'changed' where id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1' returning id$$, 'user two cannot update user one budget');
select is_empty($$delete from public.budgets where id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1' returning id$$, 'user two cannot delete user one budget');
select is_empty($$update public.savings_goals set name = 'changed' where id = 'ffffffff-ffff-4fff-8fff-fffffffffff1' returning id$$, 'user two cannot update user one goal');
select is_empty($$delete from public.savings_goals where id = 'ffffffff-ffff-4fff-8fff-fffffffffff1' returning id$$, 'user two cannot delete user one goal');

select * from finish();
rollback;
