# Everkind Supabase backend

Everkind is connected to the Supabase project used by the application. The schema and migrations are applied, and the current feature branch connects the existing React screens to shared data.

## Project configuration

- Project ref: `njuxgtacizzgwqymtcbc`
- Project URL: `https://njuxgtacizzgwqymtcbc.supabase.co`
- Region: Singapore
- Configure the frontend environment variables in the connected Netlify site for Production and any enabled branch/deploy-preview contexts:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (Supabase publishable key)
- Never expose a `service_role` key or AI provider key in a `VITE_` variable, browser code, Git, or chat.

For local development, copy `.env.example` to `.env.local` and set the same two public values. Netlify environment variables do not automatically populate a developer's local machine.

## Applied database migrations

The live project currently records 16 migrations. The repository contains SQL for the core schema and the subsequent lifecycle, RLS, discovery and pagination changes. The remote history also contains `secure_internal_functions_and_profile_roles`; its corresponding SQL file is not present in this branch and must be reconciled before further schema work:

1. Core profiles, listings, requests, saved listings, companion history, storage bucket and RPCs.
2. RLS hardening and reservation guards.
3. Reservation cancellation/rejection/collection lifecycle.
4. Collected inventory accounting and discovery RPC.
5. Non-recursive RLS helper functions.
6. Move internal helper functions to the private schema and protect profile roles.
7. Organisation signup metadata and accepted-request contact exchange.
8. RLS policy and foreign-key index optimization.
9. Donor-type storage and discovery output.
10. Preparation-time and allergen data in discovery.
11. Pickup-window and storage-instruction discovery output.
12. Guard direct edits to reserved/collected inventory and prevent deactivating listings with outstanding reservations.
13. Add trigram and city/deadline indexes for food discovery.
14. Add cursor-based pagination for food discovery.
15. Secure legacy reservation RPCs with authenticated requester checks, quantity validation and fixed search paths.
16. Preserve cancellation of pending and accepted requests while enforcing ownership.

Use the Supabase CLI for future changes after reviewing the SQL:

```bash
supabase login
supabase link --project-ref njuxgtacizzgwqymtcbc
supabase db push
```

Do not reapply already-recorded migrations manually.

## Connected application workflows

- Supabase Auth email/password signup and sign-in; Supabase issues and refreshes signed JWT sessions.
- Live food discovery using the read-only `search_food_matches` RPC.
- Donor listing creation and food photo uploads to the `food-images` bucket.
- Saved listings stored per authenticated user.
- Atomic quantity reservations through `reserve_food`.
- Requester cancellation; donor acceptance/rejection; collection settlement.
- Inventory release on cancellation/rejection and collection accounting.
- Private donor/requester phone exchange only after a request is accepted.
- Donor inbox and listing management.
- Companion conversation and message persistence.

## Showcase data

The shared project currently contains 18 illustrative Chennai food listings (`food_listings.is_demo = true`), 10 fictional donor cards, 6 fictional recipient cards, and 5 simulated activity events in separate demo-only tables. They exist to make the discovery experience explorable during a hackathon demo. The discovery RPC includes these unowned demo rows while continuing to require available status, positive remaining quantity and a future pickup deadline. Demo cards are labelled in the UI and reservation is disabled for them. No fake Auth users or rows in the real `food_requests` table are inserted. Fictional donor/recipient cards and simulated request/match/collection events live in separate demo-only tables and are labelled as illustrative. Demo listings cannot be reserved, and no impact totals are represented as real. Run `supabase/seed_demo_showcase.sql` to refresh the showcase inventory; it is idempotent and resets only the stable demo listing IDs.

## AI companion setup — one required secret

The `food-companion` Edge Function is active (version 5) with JWT verification enabled. Its CORS policy allows the Everkind production origin and Netlify deploy-preview URLs while retaining the existing Vercel origins. It checks the signed-in user, queries current food listings, keeps conversation history, and calls an OpenAI-compatible chat-completions endpoint.

The function is intentionally not usable until an AI provider key is configured. In Supabase Dashboard → Edge Functions → Secrets, add:

- `AI_API_KEY` — your provider key (required).
- `AI_BASE_URL` — optional; defaults to `https://api.openai.com/v1`.
- `AI_MODEL` — optional; defaults to `gpt-4o-mini`.
- `APP_ORIGIN` or `APP_ORIGINS` — optional allowed frontend origin(s); production fallback is the Everkind Netlify domain.

Then redeploy the function if you change its code:

```bash
supabase functions deploy food-companion
```

Never place the AI key in Netlify's browser-exposed `VITE_` environment variables. Do not paste it into a chat.

## Tamil, Telugu and voice accessibility

The companion supports Tamil (`ta-IN`), Telugu (`te-IN`) and English (`en-IN`) locale hints. Voice recognition submits a final transcript automatically, and assistant replies can be spoken aloud. Language preference is saved to the member profile.

Speech recognition and voices are supplied by the user's browser/OS. Install the relevant Tamil/Telugu speech and text-to-speech language packs on Android/Chrome where available. Support varies by device; typing and on-screen controls remain available. This is not a guarantee of universal native speech support, and the rest of the site is not yet fully translated.

## Before public launch

- Configure Supabase Auth Site URL, redirect URLs, email confirmation and production email delivery.
- Add CAPTCHA and rate limits; add phone OTP only after selecting an SMS provider and consent flow.
- Add moderation/reporting, donor verification, abuse controls, audit logs and retention rules.
- Add structured ingredient/allergen fields, food handling guidance and safe pickup handoff safeguards.
- Test RLS using separate donor, requester and anonymous accounts.
- Test simultaneous reservations, cancellation/rejection release, accepted contact visibility and collection settlement with real accounts.
- Verify Tamil/Telugu speech recognition and speech output on target Android devices.
- Select a geocoding provider before presenting GPS-based distance or nearby ranking. Current search is city/area text matching, not GPS distance. The current public website does not yet provide a marker-based map or verified distance ranking.
- Run a complete end-to-end browser test before merging or promoting this branch to production. Privacy and Terms pages are preliminary summaries and require legal review.

## Build

```bash
npm install
npm run build
```
