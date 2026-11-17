# FOODIE Supabase backend

This branch adds the database foundation, row-level security, food-image storage policies, JWT-authenticated companion Edge Function, and browser helpers for Tamil/Telugu speech.

## Create the Supabase project

1. Create a Supabase project.
2. Copy the Project URL and publishable/anon key into .env.local using .env.example.
3. Never put the service_role key or AI provider key in a VITE_ variable or browser code.
4. Install the Supabase CLI and sign in.

Commands: supabase login; supabase link --project-ref YOUR_PROJECT_REF; supabase db push.

The migration creates profiles, food listings, requests, saved listings, companion conversations/messages, RLS policies, a transactional reservation RPC, discovery RPC and food-images bucket.

## Configure the AI companion

Set Supabase secrets: AI_API_KEY, AI_BASE_URL (default https://api.openai.com/v1), AI_MODEL (default gpt-4o-mini), APP_ORIGIN (your deployed domain). Then deploy with: supabase functions deploy food-companion.

The function uses an OpenAI-compatible chat-completions endpoint. Choose an AI provider/model and add its key only as a Supabase secret. Supabase JWT verification is enabled and the function validates the bearer token through Auth. Live listings are queried before the model responds.

## Auth and voice

Supabase Auth issues JWT access tokens and refresh tokens. Enable email/password, set production Site URL and redirect URLs in Authentication > URL Configuration. Voice uses browser speech recognition/synthesis with ta-IN and te-IN locale hints. Actual language recognition and voice availability depends on browser, OS and installed language packs. Keep large text controls as a fallback; voice must not be the only way to use FOODIE.

## Public launch checklist

- Configure email confirmation, CAPTCHA and rate limits.
- Add phone OTP only after configuring an SMS provider and consent/rate limits.
- Add moderation/reporting, donor verification, audit logs and retention rules.
- Add food-safety, allergen disclosure and pickup handoff workflows.
- Test RLS with donor, requester and anonymous accounts.
- Add geocoding/distance search only after selecting a provider; current search is city/area text matching, not GPS distance.
- Test concurrent reservations and request status transitions.

The existing React app still contains localStorage demo state and demo auth. This foundation must be wired into the current screens before the production site can be called fully backend-connected. Existing local demo records are not migrated automatically.
