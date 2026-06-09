# Verdant — Personal Carbon Footprint Coach

A smart, dynamic assistant that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

> Built for the Lovable challenge. Stack: TanStack Start (React 19 + Vite 7), Lovable Cloud (Supabase: Postgres + Auth + RLS), Lovable AI Gateway (Google Gemini), Tailwind v4, Recharts.

## Chosen vertical

**Personal sustainability / climate-tech.** Specifically: a daily carbon-footprint tracker with an AI climate coach for individuals who want to reduce emissions without guilt or spreadsheets.

## What it does

1. **Sign in** (email/password or Google) — every user has private, sync'd data.
2. **Log activities** in seconds using presets across 5 categories — Transport, Food, Energy, Shopping, Waste. Each preset has a calibrated emission factor (kg CO₂e per unit).
3. **See your footprint** today and over the last 7 days, broken down by category, compared to the global average (~12.5 kg/day) and the Paris-aligned target (~5.5 kg/day).
4. **Chat with the coach** — an AI assistant ("Verdant") that reads your actual activity log and gives concrete, quantified, non-judgmental suggestions.

## Approach and logic

### Tracking
A small, curated set of presets (`src/lib/emissions.ts`) covers ~90% of personal emissions. Each preset has:
- a `category`, `action`, and `unit`
- a `factor` in kg CO₂e per unit (sourced from UK DEFRA 2023, EPA, Our World in Data)

The server computes `kg_co2e = factor × quantity` on insert — clients can't forge the math. Activities are stored per user with RLS so each user can only see their own data.

### Smart assistant logic
Each chat turn (`src/lib/chat.functions.ts`) does:
1. Persists the user message.
2. Loads the **last 40 chat turns** for conversational memory.
3. Loads the **last 60 activity rows** and computes a compact context block: today's total, 7-day total, top categories, and a recent log excerpt.
4. Sends `system + context + history + new message` to `google/gemini-3-flash-preview` via the Lovable AI Gateway.
5. Persists the assistant reply.

The system prompt constrains the model to:
- Be concise (2–5 short paragraphs / tight bullets).
- Quantify impact in kg CO₂e where useful.
- Prefer **high-leverage** actions (transport, diet, home energy) over micro-tips.
- Ground every tip in the user's actual logged activity — **never invent data**.
- Stay on-topic and non-judgmental.

This is the "dynamic decision making based on user context" — same question produces different answers depending on what the user actually logged.

### Insights
The dashboard derives:
- **Today vs. goal** (configurable; default 10 kg)
- **Today vs. global avg / Paris target** with traffic-light tone
- **Last 7 days** bar chart (red bars on goal-bust days)
- **Category breakdown** donut chart

## How the solution works (architecture)

```
┌──────────────┐    server fns    ┌────────────────────┐
│ React routes │ ───────────────▶ │ createServerFn     │
│ (TanStack)   │                  │ + requireSupabase  │
│              │                  │   Auth middleware  │
└──────┬───────┘                  └─────────┬──────────┘
       │                                    │
       │ Lovable AI Gateway                 │ RLS-scoped queries
       │ (server-only)                      ▼
       │                          ┌────────────────────┐
       ▼                          │ Lovable Cloud      │
┌──────────────┐                  │ (Supabase Postgres)│
│ Gemini 3     │                  │  activities        │
│ Flash        │                  │  chat_messages     │
└──────────────┘                  │  profiles          │
                                  └────────────────────┘
```

- **Routes** — `/` landing, `/auth` sign in, `/app` dashboard, `/coach` chat. All authenticated routes live under `_authenticated/` which gates access via `supabase.auth.getUser()`.
- **Server functions** — `src/lib/activities.functions.ts` and `src/lib/chat.functions.ts`. Every fn uses `requireSupabaseAuth` middleware and Zod input validation.
- **AI** — `src/lib/ai-gateway.server.ts` wires the AI SDK to the Lovable AI Gateway. `LOVABLE_API_KEY` never leaves the server.
- **Database** — three tables, all RLS-protected with `auth.uid() = user_id` policies; a `handle_new_user` trigger seeds a profile on signup.

## Evaluation focus areas

| Area | How it's addressed |
|---|---|
| **Code quality** | Strict TypeScript, route/server-fn separation, small focused modules, Zod-validated inputs, no any. |
| **Security** | RLS on every table, server-side emission math, secrets only in server fns, Google OAuth via Lovable broker, security-definer trigger locked down (`REVOKE EXECUTE`), input length/range caps on every Zod schema. |
| **Efficiency** | Bundled Gemini Flash (fast/cheap), context window capped at 40 msgs / 60 activities, indexed `(user_id, occurred_at desc)`, TanStack Query caching, single-flight mutations. |
| **Testing** | Functionality validated end-to-end via the live preview (signup → log → chart updates → coach responds with the logged data). Pure helpers in `src/lib/emissions.ts` (`computeKg`, `presetById`) are deterministic and trivially unit-testable. |
| **Accessibility** | Semantic HTML, labeled form fields, `aria-label` on icon buttons, keyboard-submit on the composer (Enter to send / Shift+Enter for newline), focus-visible rings via design tokens, sufficient color contrast (deep forest on cream, primary-foreground on primary), reduced-motion-friendly subtle animations only. |

## Assumptions

- **Emission factors are approximations**, suitable for personal awareness — not carbon accounting/auditing. Sources noted in `src/lib/emissions.ts`.
- **Single conversation per user.** Sufficient for a coaching use case; threading would add UX friction without information value.
- **English-only** copy and UI.
- **One unit per preset** (e.g. "km", "meal", "kWh") to keep logging fast.
- **Daily granularity** for activities (no time-of-day).
- **AI replies stream-free** (single response). Latency is sub-2s on Gemini Flash, simpler to persist atomically, and acceptable for a coaching cadence.
- The Paris-aligned daily target of 5.5 kg corresponds to a ~2 t/yr per-capita budget consistent with 1.5 °C pathways.

## Local dev

```bash
bun install
bun dev          # opens http://localhost:5173
```

Lovable Cloud is auto-provisioned; `LOVABLE_API_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` are injected.

## File map (essentials)

```
src/
  lib/
    emissions.ts             Pure: presets, categories, factors, computeKg
    ai-gateway.server.ts     AI SDK ↔ Lovable AI Gateway
    activities.functions.ts  log/list/delete + profile/goal
    chat.functions.ts        list/send/clear + system prompt + context builder
  routes/
    __root.tsx               Providers, auth listener, error/404 boundaries
    index.tsx                Landing page
    auth.tsx                 Sign in / up + Google
    _authenticated/
      route.tsx              Auth gate (ssr:false)
      app.tsx                Dashboard
      coach.tsx              AI chat
    sitemap[.]xml.ts         Sitemap
  styles.css                 Design tokens (bold-climate palette)
  assets/logo.png            Brand mark
```
