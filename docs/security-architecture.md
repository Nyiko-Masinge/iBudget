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

- RLS is enabled on user-owned records; policies scope reads and writes to `auth.uid()`.
- The profile primary key is the authenticated user ID; child records carry ownership under RLS checks.
- Database triggers validate account/category ownership for transactions, category ownership for budget allocations, and linked transaction ownership for goal contributions.
- Achievement awards, snapshots, and insights are client read-only; their direct client mutation grants are revoked.
- Supabase configuration is parsed before the client is constructed. Data access applies bounded query limits and validates returned transaction shape.
- Data layer errors shown to the UI are generic; raw database messages are not forwarded to users.
- `.env` files are ignored; only placeholder examples are tracked.

## Production requirements before real financial data

1. Apply migrations to a new development Supabase project and test with at least two accounts. Verify cross-user reads, inserts, updates, deletes, category references, and contribution links are denied.
2. Enable email verification, configure auth rate limits and an appropriate password policy, and review redirect URLs. Add MFA for administrative and sensitive account changes.
3. Use separate Supabase projects and credentials for development, staging, and production. Restrict project dashboard access, rotate keys after exposure, and never use the service-role key in a client.
4. Add automated database policy tests and a security review for every migration. Keep database backups and rehearse restore procedures.
5. Add server-side authorization, input validation, abuse limits, and audit logging to any future Edge Function. Authenticate the user from the verified JWT; never trust a caller-supplied user ID. Keep privileged operations narrow and avoid logging transaction details.
6. Review dependency updates, Expo web security headers/CSP, session behavior, account deletion/export, and incident response before launch.

These controls reduce common attack paths but cannot guarantee that an application will never be compromised. This repository is a development foundation, not a security certification or production approval.
