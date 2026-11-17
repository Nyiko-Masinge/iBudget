# iBudget security architecture

## Trust boundaries

```text
apps/mobile (untrusted Expo client)
  ├─ presentation and form validation
  ├─ packages/finance-core (pure deterministic calculations)
  └─ packages/data-access (public-key Supabase client and scoped queries)
          │ HTTPS + user access token; publishable key only
          ▼
backend/supabase
  ├─ PostgreSQL constraints and Row Level Security
  ├─ migrations (source of truth)
  └─ future Edge Functions for trusted server-only operations
```

Everything shipped to a phone or browser is public and can be inspected or modified by a user. Client validation improves usability but is not a security boundary. Supabase RLS, foreign keys, and database triggers enforce access and ownership. The publishable key is safe only with those controls enabled. Never put a service-role key or other privileged credential into Expo code, `EXPO_PUBLIC_*`, app configuration, or client logs.

## Current controls

- RLS is enabled on every application table; ownership policies scope user records to `auth.uid()`.
- A final hardening migration removes `CREATE` on `public` and broad table/function/sequence defaults from Data API roles, then grants only the table operations used by the current client. It preserves `public` schema `USAGE` for Supabase-managed services. Future `postgres`-owned public objects default to no client access.
- The profile primary key is the authenticated user ID; child records carry ownership under RLS checks.
- Database triggers validate account/category ownership for transactions, category ownership for budget allocations, and linked transaction ownership for goal contributions.
- Achievement awards, snapshots, and insights are client read-only; their direct client mutation grants are revoked.
- Supabase configuration is parsed before the client is constructed. Data access applies bounded query limits and validates returned transaction shape.
- Database and network errors are sanitized before reaching UI messages. Sign-in, registration, confirmation, and password reset responses avoid identifying whether an email has an account.
- Auth links use PKCE, and the callback accepts only the app's configured callback URL before exchanging a one-time authorization code.
- Native auth sessions use SecureStore; web sessions use tab-scoped `sessionStorage` to avoid leaving refresh tokens in long-lived `localStorage`. This does not protect against scripts executing in the page.
- The in-memory React Query cache is cleared when the signed-in user changes, preventing one account's cached records from carrying into another account's session on the same device.
- `.env` files are ignored; only placeholder examples are tracked.
- pgTAP checks assert grants/RLS state and exercise cross-user reads, inserts, updates, and deletes. A GitHub Actions workflow runs these checks when backend files change.
- Dependabot checks npm packages and GitHub Actions weekly; CI runs `npm audit` for dependency changes and on a weekly schedule.

## Production requirements before real financial data

1. Apply migrations to a disposable development project, run `npx supabase test db --workdir backend`, and run the two-account policy checks through the Supabase client. Review grants and policies in the live target before any production migration.
2. In the hosted Supabase project, enable email verification, configure Auth rate limits and a strong password policy, enable CAPTCHA for public auth flows, and allow only exact redirect URLs used by deployed environments. Add MFA for project administrators and sensitive user account changes.
3. Use separate Supabase projects and credentials for development, staging, and production. Restrict project dashboard access, rotate keys after exposure, and never use the service-role key in a client.
4. Enable repository secret scanning and push protection where available. Scan the full Git history before launch; if any privileged key is found, revoke and rotate it. Keep database backups and rehearse restore procedures. Review each migration and its privilege diff before applying it.
5. Add server-side authorization, input validation, abuse limits, and audit logging to any future Edge Function. Authenticate the user from the verified JWT; never trust a caller-supplied user ID. Keep privileged operations narrow and avoid logging transaction details.
6. Before hosting the web build, configure HTTPS and host-level security headers: a project-specific Content Security Policy (including `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, and a restrictive `Referrer-Policy`. Validate the CSP against a production web build; do not use permissive wildcards for the Supabase origin. The repository has no deployment host configured, so these HTTP headers cannot be safely activated here.
7. Review dependency alerts, account deletion/export, privacy retention, monitoring, incident response, and key rotation procedures before launch.

These controls reduce common attack paths but cannot guarantee that an application will never be compromised. The new grants and RLS tests have not been run in this environment, and the migration has not been applied to a hosted database. This repository is not a security certification or production approval.
