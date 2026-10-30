# iBudget

Mobile-first personal budgeting app, organized as a small monorepo with a clear client/backend boundary. Expo is the untrusted client. Supabase PostgreSQL, RLS policies, constraints, and triggers enforce data access. A public publishable key is used by the client; no privileged server key is shipped in the app.

## Structure

- `apps/mobile`: Expo Router app, screens, platform session storage and UI providers.
- `packages/finance-core`: deterministic money calculations and shared schemas.
- `packages/data-access`: Supabase client construction, auth operations, and bounded/validated data queries. This package runs in the client and has no privileged credentials.
- `backend/supabase`: backend configuration and database migrations; future trusted Edge Functions belong here.
- `docs`: financial, backend setup, and security architecture notes.

See [security architecture](docs/security-architecture.md) for trust boundaries and release hardening requirements.

## Setup

Use Node.js 20 LTS and npm. Copy `apps/mobile/.env.example` to `apps/mobile/.env`, then set the Supabase project URL and publishable key. Never place a service-role key in any Expo variable or source file.

```sh
npm install
npm run start
```

Run `npm run web`, `npm run android`, or `npm run ios` for other Expo targets. For Supabase local development, install the Supabase CLI and Docker, then run `npm run supabase:start`. See [Supabase setup](docs/supabase-setup.md).

## Backend workflow

1. Review migrations under `backend/supabase/migrations`.
2. Link a development project with `npx supabase link --project-ref YOUR_PROJECT_REF --workdir backend`.
3. Apply reviewed migrations with `npx supabase db push --workdir backend`.
4. Test RLS using separate user accounts before loading any real financial data.

Do not apply this initial development schema blindly to an existing database. It has not been applied to or verified against a live Supabase project.

## Status

This is an early development foundation. The mobile client has tab navigation, email sign-in/sign-up, and a transaction summary. The schema and client structure are separated, and ownership checks are enforced in the database migration. Account creation, transaction entry/editing, onboarding, budget and goal workflows, server-side award evaluation, reporting, and forecasting remain incomplete. No production security audit, live backend test, or deployment has occurred.

Run `npm run typecheck`, `npm test`, and `npm run lint` after installing dependencies. Dependency installation and these checks have not yet succeeded in this environment. Review, apply, and test the migration in a disposable development project before production planning.
