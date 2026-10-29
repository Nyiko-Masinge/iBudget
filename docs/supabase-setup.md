# Supabase development setup

1. Create a Supabase project and enable email/password sign-in under Authentication > Providers.
2. Copy the project URL and public publishable/anon key into `apps/mobile/.env` using `apps/mobile/.env.example` as the template. Do not use or expose a service-role key in Expo.
3. Install the Supabase CLI for your operating system and verify `supabase --version`.
4. From the repository root, link the intended development project: `supabase link --project-ref YOUR_PROJECT_REF --workdir backend/supabase`.
5. Review `backend/supabase/migrations/202610290001_initial_schema.sql`, then apply with `supabase db push --workdir backend/supabase`.
6. Start the app from the repository root with `npm install` and `npm run start`; authenticate with an email address and password.

The migration creates the initial schema and user-scoped RLS. Do not apply it blindly to a database that already has tables/types. Verify resulting policies and ownership using two separate test accounts before using real financial data. The repository does not include a live project reference, generated database types, or service credentials.

On native mobile, Supabase sessions use Expo SecureStore. The browser client uses Supabase's browser storage behavior, so production web hosting must use a strict Content Security Policy, HTTPS, and a review of every source of untrusted HTML to reduce token theft through XSS.
