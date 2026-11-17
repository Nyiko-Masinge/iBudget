# Deploy iBudget web to Vercel

This repository contains an Expo app and shared workspace packages. Vercel hosts the **web version**; it does not keep Expo Go running and it does not publish an iOS or Android store app.

## One-time setup

1. Push this repository to a private or public GitHub repository. Keep `.env` out of Git; it is ignored. Since this checkout is inside OneDrive, consider moving the Git working copy to a regular local development folder and keeping GitHub as the shared source of truth. OneDrive pausing or syncing `.git` can interrupt Git operations.
2. In Vercel, choose **Add New → Project**, connect GitHub, and import this repository. Leave the project root at the repository root so npm can see the workspace packages and root lockfile.
3. The checked-in `vercel.json` runs the Expo web export from the mobile workspace and serves `apps/mobile/dist`. Vercel should detect the root `package-lock.json`; use npm for installation.
4. Add these environment variables in **Project → Settings → Environment Variables**. Add them to both **Production** and **Preview** (or set different Supabase projects for each):
   - `EXPO_PUBLIC_SUPABASE_URL` — the project URL from Supabase.
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key. It is intended for browser use; never put a Supabase secret or `service_role` key in an `EXPO_PUBLIC_` variable.
   - `EXPO_PUBLIC_MAINTENANCE_MODE` — `false` for normal operation.
   - `EXPO_PUBLIC_MAINTENANCE_MESSAGE` — optional message shown on the maintenance screen.
5. Deploy. Vercel assigns a `*.vercel.app` address, so you can start without buying a domain.
6. In Supabase **Authentication → URL Configuration**, set the Site URL to the production Vercel address and add the exact production callback URL `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs. Add the preview host only if you need sign-in tests on preview deployments. Keep the existing native app callback URLs.

## Publish updates without keeping a terminal open

Vercel builds on its servers after Git receives a push. The terminal can be closed after the push completes; users visit the hosted Vercel URL.

1. Make changes in VS Code/Codex.
2. Commit and push a feature branch using the editor’s Source Control panel or GitHub Desktop. Vercel creates a Preview deployment for review.
3. Merge the reviewed change into the production branch (usually `main`). Vercel automatically builds and publishes the new production version.
4. Check the deployment status and logs in the Vercel dashboard if a build fails; the previous successful deployment remains available for rollback.

You still need a Git push for Vercel to receive code. You do **not** need to leave `npm run web` or Expo Go running for the hosted website to stay available. Expo Go is for local development. Native iOS/Android releases require a separate EAS Build / store release workflow.

## Show the maintenance screen

In Vercel **Project → Settings → Environment Variables**, change `EXPO_PUBLIC_MAINTENANCE_MODE` to `true` for **Production**, then redeploy the latest production deployment so the build picks up the value. Optionally set `EXPO_PUBLIC_MAINTENANCE_MESSAGE` to a short notice. When work is complete, set the mode back to `false` and redeploy. Preview can stay `false` so you can test changes privately while production shows maintenance.

This screen is a user-facing notice; it does not stop database/API requests or secure data by itself. Supabase Row Level Security and server-side authorization remain the security boundary. Keep service keys private and verify RLS policies for every table.

## Free plan notes

Vercel Hobby is free for personal, non-commercial projects. If iBudget is used as a commercial/business service, check the plan terms before launch. Supabase is a separate service with its own limits; its Free projects can pause after a week of low activity, which makes the hosted website appear unavailable until the project is restored.
