# iBudget

A mobile-first personal budgeting and financial wellness application built with Expo, React Native, TypeScript, and Supabase. This repository currently contains the initial app foundation, authenticated cloud session entry, ledger summary, exact minor-unit finance helpers, and an initial RLS schema migration. It is an early development build, not a production release.

## Requirements and startup

Use Node.js 20 LTS and npm. From the repository root:

```sh
npm install
cp .env.example .env
npm run start
```

Use `npm run web` for browser development or scan the Expo Go QR code on a phone. Expo may prompt for a matching SDK dependency adjustment if its current SDK differs from the pinned initial package set.

## Supabase setup

1. Create a Supabase project and configure email authentication.
2. Copy the project URL and publishable (or legacy anon) key into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Install the Supabase CLI using its official instructions, then run `supabase init` only if CLI metadata is not already present.
4. Link your development project and apply migrations with `supabase link --project-ref YOUR_PROJECT_REF` and `supabase db push`.
5. Never put a service-role key in the app. `.env` is ignored by Git; `.env.example` contains placeholders only.

The migration source of truth is `supabase/migrations`. Review SQL before applying it to any existing project. The migration is designed for a new development database; it has not been applied to a live project in this workspace.

## Implemented foundation

- Expo Router tabs for Home, Transactions, Budgets, Goals, and Reports.
- Supabase email sign-up/sign-in and persisted session adapter.
- TanStack Query data loading for a user-scoped transaction summary.
- Integer minor-unit helpers for income, expenses, refunds, transfers, budget remainder, safe-to-spend, health zones, and display formatting.
- Initial normalized schema for profiles, accounts, categories, transactions, budgets, allocations, goals, goal contributions, achievements, snapshots, and insights, with RLS enabled.

## Development status and limitations

The Supabase URL/key and a project are required for cloud authentication. No remote project was available, so cloud authentication and RLS behavior have not been verified. The current UI does not yet implement transaction entry/edit/reversal, account management, onboarding, budgets, goal contribution workflows, reporting charts, achievement evaluation, or forecasts. Those screens intentionally avoid invented personal figures. The initial migration requires a security review and policy tests before production use; in particular, category ownership checks for transaction and allocation references need database-enforced validation before accepting arbitrary client writes.

Run `npm run typecheck`, `npm run lint`, and `npm test` after installing dependencies. No tests are included yet; the functions in `src/domain/money.ts` are intended for deterministic unit coverage in the next development phase.

## Next steps

1. Install dependencies and resolve SDK compatibility, then verify web/mobile startup and strict TypeScript checks.
2. Add input schemas and transaction/account create/edit/reversal flows with ownership-safe database constraints.
3. Complete onboarding, budget allocations, safe-to-spend, goals, and contribution ledger.
4. Add unit/integration/RLS policy tests, Supabase setup docs, generated DB types, and a release-grade accessibility/security pass.
