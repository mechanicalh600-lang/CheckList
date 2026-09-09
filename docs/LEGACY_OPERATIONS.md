# CheckList Legacy Operations Runbook

## Purpose

CheckList is maintained as a fully operational historical NewRay application. The visible historical product experience is preserved while invisible technical maintenance continues.

## Data preservation

Historical production data is retained. Do not bulk-delete, anonymize, reseed, reset, or replace factory data as part of routine maintenance. Any destructive business-data operation requires an explicit preservation decision and a verified recovery path.

## Required deployment configuration

The public GitHub Pages build requires these GitHub Actions repository secrets:

- `SUPABASE_URL` — the CHECK LIST Supabase project URL
- `SUPABASE_ANON_KEY` — the CHECK LIST browser publishable/anon key

The deployment workflow deliberately fails before building when either required value is absent. This prevents a green deployment that renders the UI but cannot reach its database.

Local development uses an ignored `.env` copied from `.env.example`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (optional; see AI boundary below)

Never commit a populated `.env` file.

## AI boundary

A Gemini key injected into a Vite browser build is observable by browser users even if it originated from a GitHub Secret or `.env`. Therefore a sensitive Gemini key must not be enabled in the public legacy frontend. Re-enable the historical AI feature only through a protected server-side/Edge Function proxy or another equivalent secret-holding boundary.

## Authentication and authorization

Application users are the historical records in `defined_users`; there is no hardcoded login path. Password verifiers are held in the private `museum_private` schema. Sessions are revocable and expire.

RLS enforces operational ownership. Operators see and modify their own inspections/results/logs, while administrators retain the broader access required by the historical application. Identity references from inspections and user logs to `defined_users` are protected with foreign keys so historical ownership cannot silently become orphaned.

## Supabase advisor notes

The Supabase security advisor reports public/signed-in GraphQL schema discoverability for the public tables and reports several intentional `SECURITY DEFINER` RPCs. These warnings are currently expected by this legacy architecture:

- The browser uses the Supabase publishable/anon role plus a separately validated legacy session header.
- Table grants are required for PostgREST; RLS determines which rows are actually visible or writable.
- Login, session restore/logout, password change, and administrator password reset are intentionally exposed RPC entry points and contain session/role checks.

If the identity architecture is later migrated to Supabase Auth or a dedicated backend, revisit these accepted warnings and reduce the exposed surface.

## Deployment verification

The live browser smoke workflow runs only after a successful deployment (plus scheduled/manual runs). This avoids testing the previous deployment while a new one is still publishing.
