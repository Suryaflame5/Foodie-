# Everkind AI — free provider setup

Everkind's web and mobile clients share the Supabase `food-companion` Edge Function. Do not add provider credentials to Vite variables, browser code, mobile bundles, or Git.

## Text companion (free tier)

1. Create a free GroqCloud account at https://console.groq.com/.
2. Create an API key at https://console.groq.com/keys.
3. In Supabase Dashboard → Edge Functions → Secrets, add:
   - Name: `GROQ_API_KEY`
   - Value: your Groq API key
4. Leave `AI_BASE_URL` and `AI_MODEL` unset to use the defaults:
   - Base URL: `https://api.groq.com/openai/v1`
   - Model: `openai/gpt-oss-20b`

The Edge Function continues to support the legacy `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` settings. If `GROQ_API_KEY` is present, it takes precedence and selects the Groq defaults. The function still verifies the Supabase user JWT and uses the signed-in user's RLS-scoped client.

Free hosted inference is rate-limited and subject to provider quotas/availability. It is not unlimited or a guaranteed production SLA. Check the live limits in the provider console before launch.

## Voice

The web client uses browser speech recognition and browser speech synthesis. It does not require a paid speech API key. Actual language availability and voice quality depend on the browser, operating system, installed language packs, and microphone permission. The UI must keep text entry available whenever voice is unavailable.

Language tags:
- English: `en-IN`
- Tamil: `ta-IN`
- Telugu: `te-IN`

## Important limitations

- The current free Groq chat model is text-only; this setup does not enable food-photo vision analysis.
- Smart matching remains grounded in the existing `search_food_matches` database RPC; the model must not invent stock, distance, or availability.
- Publishing listings, reserving food, and changing inventory remain explicit user actions enforced by existing backend policies.
- Do not claim voice is available in every browser. Provide typed input and readable text as the fallback.
