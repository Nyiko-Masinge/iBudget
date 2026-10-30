# Supabase setup for this app

This walkthrough is for a new development project. Do not use a production database for first-time setup.

## 1. Create your hosted development project

1. Sign in at [Supabase](https://supabase.com/dashboard) and create an organization if prompted.
2. Select **New project**. Name it `iBudget-dev`, choose the region closest to your users, and create a strong database password. Save that password in a password manager. You will not put it in the Expo app.
3. Wait until the project status says it is ready.

## 2. Copy the two client-safe values

1. Open the project's **Connect** dialog, or go to **Project Settings → API Keys**.
2. Copy the **Project URL** and the **Publishable key** (`sb_publishable_...`). The new publishable key is intended for browser and mobile apps; access still depends on signed-in users and RLS.
3. In PowerShell at the repository root, run:

   ```powershell
   Copy-Item apps/mobile/.env.example apps/mobile/.env
   notepad apps/mobile/.env
   ```

4. Replace the example URL and key in `apps/mobile/.env`. Do not paste those values into chat or commit this file. The publishable key is visible in the app by design; **never use a Secret key (`sb_secret_...`) here**. If you see a long legacy `service_role` key, keep it out of the app too.

## 3. Set up email sign-in

Email/password sign-in is enabled by default. In the project Dashboard open **Authentication → Sign In / Providers** and confirm Email is enabled. Keep email confirmation enabled before real users or real financial data.

The hosted default email sender is for evaluation: Supabase currently limits it to project team email addresses and a low send rate. For general signup testing and for production, configure a custom SMTP provider under the Auth email settings. This app's current sign-up screen does not yet implement the email confirmation deep-link/verification screen, so use a disposable development project and your own team email for a first test; do not turn off confirmation on a project containing real user data. [Supabase email/password docs](https://supabase.com/docs/guides/auth/passwords), [email delivery limits](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Install the CLI and apply the database schema

From the repository root, install the Supabase CLI as a development tool and authenticate it:

```powershell
npm install
npm install --save-dev supabase
npx supabase login
```

The CLI may open a browser to sign in. The app does not need your Supabase account password or database password. Find the **project reference** in the project dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

The repo already has the CLI config in `backend/supabase/config.toml` and the schema migration in `backend/supabase/migrations/`. Link this local backend folder to your new development project, preview, then apply:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF --workdir backend
npx supabase db push --dry-run --workdir backend
npx supabase db push --workdir backend
```

The CLI will ask for the database password you saved when creating the project. Enter it in the CLI prompt; do not put it in `.env` or source code. The `--dry-run` previews pending migrations. `db push` applies the repository migration to the linked database. It is intended for a new, empty development project; stop if the project already contains tables or data and ask before pushing.

Optional local database testing needs Docker Desktop:

```powershell
npm run supabase:start
npx supabase db reset --workdir backend
```

`db reset` destroys and recreates only the local Docker database. Do not add `--linked` for this step.

## 5. Run and smoke-test the app

```powershell
npm run start
```

Choose the web target in Expo or scan the QR code with Expo Go. For web use `npm run web`. Sign up with a development email, then check **Authentication → Users** and confirm the user was created. The profile row is created by a database trigger. The transaction list should load after sign-in; adding transactions is not implemented yet.

## Security checks to do before real data

- In **Table Editor**, confirm the user-owned tables have RLS enabled.
- Create two test users. Confirm each cannot read or edit the other user's records. Never test RLS using the SQL Editor as `postgres`; that administrative role bypasses normal user policies.
- Keep only the publishable key in `apps/mobile/.env`. Do not create or share a Secret/service-role key for the mobile app.
- Keep using migrations for schema changes. Do not make one-off dashboard SQL changes that are absent from the repo.
- Before launch, configure custom SMTP, review redirect URLs, test account recovery and email verification end to end, use separate dev and production projects, and run an independent security review.

The schema and RLS migration have not yet been applied to a live project or independently security-tested. This setup does not certify the app as production-ready.
