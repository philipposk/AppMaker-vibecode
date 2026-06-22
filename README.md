# AppMaker

AppMaker turns a plain-English description into a working little web app. You type something like "a tip calculator that splits the bill," and it hands back a single ready-to-use HTML file in a few seconds — preview it right there, tweak it by asking for changes, and save the ones you like to your account. It's for quickly spinning up small tools and toys without writing code or setting anything up.

## What it does
- Describe an app in words, get a working HTML/CSS/JS file back instantly
- Live preview in the page, plus copy, download, or open-in-new-tab
- "Refine" an app by asking for changes — it edits the existing version and keeps a history
- Sign in to save your apps; come back later to view, edit, or delete them
- Free to run — it cycles through free AI models so there's no per-use cost

## Status
Working. Needs one free AI key (OpenRouter) to generate, and it's built to deploy on Vercel at `appmaker.6x7.gr` with shared 6x7 login.

---
### For developers

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript. Auth/DB via the shared `6x7-platform` Supabase project (schema `appmaker`). AI generation via OpenRouter free models, cycled by a TypeScript port of `llm-free-rotator` (`src/lib/llm-rotator.ts`).

**Data model** (`appmaker` schema, RLS `auth.uid() = user_id`):
- `apps` — one row per saved app. `generated_code` jsonb holds `{ entry, files }` (currently a single `index.html`). `generation` jsonb records provider + model.
- `iterations` — one row per create/refine, the edit history (prompt, model, source, duration).

**API:** `POST /api/generate` does both fresh generation (optional `save` → new `apps` row) and refine (`appId` → regenerates from prior HTML, updates the app, logs an iteration). Rate-limited per IP (`src/lib/rateLimit.ts`).

**Auth:** Supabase SSR (`@supabase/ssr`) with a shared cookie `sb-6x7-auth` on `.6x7.gr`, so login carries across all 6x7 subdomains. Session refresh in `src/proxy.ts` (Next 16 proxy/middleware).

**Pages:** `/` generate, `/my-apps` saved grid, `/my-apps/[id]` editor + history, `/auth/*` sign-in/out/callback.

**Setup:**
1. `npm install`
2. `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (shared 6x7 project) and `OPENROUTER_API_KEY` (free at https://openrouter.ai/keys).
3. `npm run dev` → http://localhost:3000

**Deploy:** Vercel project linked to the `6x7-platform` Supabase project (Supabase env vars auto-inject). Add `OPENROUTER_API_KEY` in Vercel env. Point `appmaker.6x7.gr` at it. In Supabase Auth: add `https://appmaker.6x7.gr/auth/callback` to redirect URLs and enable Google.
