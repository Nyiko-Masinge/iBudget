# Supabase development setup

1. Create a Supabase project and enable email/password sign-in under Authentication > Providers.
2. In project API settings, copy the project URL and public publishable/anon key into the root `.env` file. Do not use or expose a service-role key in Expo.
3. Install the Supabase CLI for your operating system and verify `supabase --version`.
4. From this repository, link the intended development project: `supabase link --project-ref YOUR_PROJECT_REF`.
5. Review `supabase/migrations/202610290001_initial_schema.sql`, then apply with `supabase db push`.
6. Start the app with `npm install` and `npm run start`; authenticate with an email address and password.

The migration creates the initial schema and user-scoped RLS. Do not apply it blindly to a database that already has tables/types. Verify resulting policies and ownership using two separate test accounts before using real financial data. The repository does not include a live project reference, generated database types, or service credentials.
