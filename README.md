# Everkind Web

**Good food deserves another chance.**

Everkind is a community surplus-food discovery and sharing platform. It helps neighbours, community kitchens and local businesses make surplus edible food visible to people who may be able to collect it. It is not a food-delivery marketplace.

## Current implementation

- Responsive React + TypeScript application.
- Supabase Auth email/password sessions.
- Shared PostgreSQL listings, saved food and request history with Row Level Security.
- Food photo uploads to Supabase Storage.
- Atomic reservation and inventory lifecycle: request, accept/reject, cancel and mark collected.
- Donor inbox and private contact exchange after acceptance.
- Tamil/Telugu/English voice-first food companion UI, backed by a JWT-verified Supabase Edge Function.
- Netlify production hosting with a separate GitHub review branch for this implementation.

The Supabase project `njuxgtacizzgwqymtcbc` is healthy. It contains 18 clearly flagged Chennai showcase listings (`is_demo = true`) for product demonstrations. These are not verified community offers; demo reservations are disabled, and no demo profiles, requests, or impact totals are fabricated.

## Local setup

Requirements: Node.js 20+ and npm.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the Supabase project URL and publishable key.
3. Never expose a service-role key or AI provider key in frontend variables.
4. Run:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## AI companion secret

The Supabase Edge Function is deployed with JWT verification. To enable generated companion replies, configure `AI_API_KEY` in Supabase Edge Function Secrets. Optional `AI_BASE_URL`, `AI_MODEL` and `APP_ORIGIN(S)` settings are documented in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

Voice recognition and speech output depend on the user's browser, OS and installed Tamil/Telugu language packs. The app keeps text controls as a fallback. Full-site Tamil/Telugu translation, geocoded distance search, donor verification, moderation, and production abuse controls remain launch work.

## Deploy

The current production site is hosted on Netlify at `https://everkindhub.netlify.app`. Build command: `npm run build`; publish directory: `dist`; Node runtime: 22. The working implementation is in a draft pull request and has not been merged to `main` or promoted to production.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify environment for the intended deploy contexts. Never add service-role or AI provider credentials to browser-exposed `VITE_` variables.

For the repeatable showcase dataset, review `supabase/seed_demo_showcase.sql`. Every row is tagged `is_demo = true`; exclude it from real impact reporting. See [the Supabase setup and launch checklist](docs/SUPABASE_SETUP.md).
